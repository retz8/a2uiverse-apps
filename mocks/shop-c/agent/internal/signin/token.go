package signin

import (
	"crypto/ecdsa"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"slices"
	"strings"

	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/members"
)

// token is the token endpoint: the device code exchanged (RFC 8628, section 3.4) and a refresh
// token used (RFC 6749, section 6).
func (s *Server) token(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		oauthError(w, http.StatusBadRequest, "invalid_request", "the request is not a form")
		return
	}
	clientID := r.PostForm.Get("client_id")
	s.mu.Lock()
	c, known := s.state.Clients[clientID]
	s.mu.Unlock()
	if !known {
		oauthError(w, http.StatusUnauthorized, "invalid_client", "this client is not registered here")
		return
	}
	grantType := r.PostForm.Get("grant_type")
	if !slices.Contains(c.Grants, grantType) {
		if slices.Contains(grantTypes, grantType) {
			oauthError(w, http.StatusBadRequest, "unauthorized_client", "this client did not register the grant "+grantType)
		} else {
			oauthError(w, http.StatusBadRequest, "unsupported_grant_type", "the grant "+grantType+" is not issued here")
		}
		return
	}
	switch grantType {
	case DeviceCodeGrant:
		s.exchangeDeviceCode(w, clientID, r.PostForm.Get("device_code"))
	case "refresh_token":
		s.refresh(w, clientID, r.PostForm.Get("refresh_token"))
	}
}

func (s *Server) exchangeDeviceCode(w http.ResponseWriter, clientID, deviceCode string) {
	hash := hashToken(deviceCode)
	now := s.cfg.Now()
	s.mu.Lock()
	p, ok := s.pending[hash]
	if !ok || p.clientID != clientID {
		s.mu.Unlock()
		oauthError(w, http.StatusBadRequest, "invalid_grant", "this device code is not one issued to this client")
		return
	}
	switch {
	case now.After(p.expires):
		s.forget(hash, p)
		s.mu.Unlock()
		oauthError(w, http.StatusBadRequest, "expired_token", "the code has expired")
		return
	case p.refused:
		s.forget(hash, p)
		s.mu.Unlock()
		oauthError(w, http.StatusBadRequest, "access_denied", "the member refused")
		return
	case p.subject == "":
		tooSoon := !p.lastAsk.IsZero() && now.Sub(p.lastAsk) < p.interval
		p.lastAsk = now
		if tooSoon {
			p.interval += PollInterval
			s.mu.Unlock()
			oauthError(w, http.StatusBadRequest, "slow_down", "ask less often")
			return
		}
		s.mu.Unlock()
		oauthError(w, http.StatusBadRequest, "authorization_pending", "the member has not finished yet")
		return
	}
	s.forget(hash, p)
	refresh := random(32)
	s.state.Refresh[hashToken(refresh)] = grant{
		ClientID: clientID, Subject: p.subject, Scope: p.scope, Expires: now.Add(RefreshTokenLifetime),
	}
	answer, err := s.issue(clientID, p.subject, p.scope, hashToken(refresh))
	s.mu.Unlock()
	if err != nil {
		oauthError(w, http.StatusInternalServerError, "server_error", "the sign-in could not be kept")
		return
	}
	answer["refresh_token"] = refresh
	writeJSON(w, http.StatusOK, answer)
}

// forget drops a pending authorization; the caller holds the lock.
func (s *Server) forget(hash string, p *pending) {
	delete(s.pending, hash)
	delete(s.byUser, p.userCode)
}

func (s *Server) refresh(w http.ResponseWriter, clientID, refresh string) {
	hash := hashToken(refresh)
	now := s.cfg.Now()
	s.mu.Lock()
	g, ok := s.state.Refresh[hash]
	if !ok || g.ClientID != clientID || now.After(g.Expires) {
		s.mu.Unlock()
		oauthError(w, http.StatusBadRequest, "invalid_grant", "this refresh token is not live")
		return
	}
	answer, err := s.issue(clientID, g.Subject, g.Scope, hash)
	s.mu.Unlock()
	if err != nil {
		oauthError(w, http.StatusInternalServerError, "server_error", "the sign-in could not be kept")
		return
	}
	writeJSON(w, http.StatusOK, answer)
}

// issue writes a new access token, and an ID token where openid was granted, and keeps the
// state; the caller holds the lock.
func (s *Server) issue(clientID, subject, scope, refreshHash string) (map[string]any, error) {
	now := s.cfg.Now()
	access := random(32)
	s.state.Access[hashToken(access)] = grant{
		ClientID: clientID, Subject: subject, Scope: scope, Expires: now.Add(AccessTokenLifetime),
		Refresh: refreshHash,
	}
	if err := s.state.save(s.cfg.StateDir, now); err != nil {
		return nil, err
	}
	answer := map[string]any{
		"access_token": access,
		"token_type":   "Bearer",
		"expires_in":   int(AccessTokenLifetime.Seconds()),
		"scope":        scope,
	}
	if slices.Contains(strings.Fields(scope), "openid") {
		m, _ := members.Find(subject)
		idToken, err := s.idToken(clientID, m)
		if err != nil {
			return nil, err
		}
		answer["id_token"] = idToken
	}
	return answer, nil
}

// idToken is an OpenID Connect ID token naming the member, signed ES256 with the ID-token key.
func (s *Server) idToken(clientID string, m members.Member) (string, error) {
	now := s.cfg.Now()
	header, _ := json.Marshal(map[string]string{"alg": "ES256", "kid": s.cfg.IDKey.ID, "typ": "JWT"})
	claims, _ := json.Marshal(map[string]any{
		"iss":   s.cfg.Issuer,
		"sub":   m.Subject,
		"aud":   clientID,
		"iat":   now.Unix(),
		"exp":   now.Add(IDTokenLifetime).Unix(),
		"name":  m.Name,
		"email": m.Email,
	})
	input := base64.RawURLEncoding.EncodeToString(header) + "." + base64.RawURLEncoding.EncodeToString(claims)
	sum := sha256.Sum256([]byte(input))
	r, sig, err := ecdsa.Sign(rand.Reader, s.cfg.IDKey.Private, sum[:])
	if err != nil {
		return "", err
	}
	// JWS writes an ECDSA signature as R and S, each 32 bytes for P-256 (RFC 7518, section 3.4).
	out := make([]byte, 64)
	r.FillBytes(out[:32])
	sig.FillBytes(out[32:])
	return input + "." + base64.RawURLEncoding.EncodeToString(out), nil
}

// revoke is the revocation endpoint (RFC 7009). Revoking a refresh token revokes the access
// tokens issued under it. A token the server does not know is answered 200, as the RFC asks.
func (s *Server) revoke(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		oauthError(w, http.StatusBadRequest, "invalid_request", "the request is not a form")
		return
	}
	clientID := r.PostForm.Get("client_id")
	hash := hashToken(r.PostForm.Get("token"))
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, known := s.state.Clients[clientID]; !known {
		oauthError(w, http.StatusUnauthorized, "invalid_client", "this client is not registered here")
		return
	}
	if g, ok := s.state.Refresh[hash]; ok {
		if g.ClientID != clientID {
			oauthError(w, http.StatusBadRequest, "unauthorized_client", "this token was not issued to this client")
			return
		}
		delete(s.state.Refresh, hash)
		for access, a := range s.state.Access {
			if a.Refresh == hash {
				delete(s.state.Access, access)
			}
		}
	} else if g, ok := s.state.Access[hash]; ok {
		if g.ClientID != clientID {
			oauthError(w, http.StatusBadRequest, "unauthorized_client", "this token was not issued to this client")
			return
		}
		delete(s.state.Access, hash)
	}
	if err := s.state.save(s.cfg.StateDir, s.cfg.Now()); err != nil {
		oauthError(w, http.StatusInternalServerError, "server_error", "the revocation could not be kept")
		return
	}
	w.WriteHeader(http.StatusOK)
}
