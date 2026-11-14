// Package signin is Halide Supply's own OAuth 2.0 authorization server, run in the store's
// process on the origin of its A2A endpoints. A member signs in by the device authorization grant
// of RFC 8628 alone, on the store's sign-in page. A client introduces itself by dynamic
// registration (RFC 7591). The server issues an OpenID Connect ID token naming the member,
// refresh tokens, and revokes tokens as RFC 7009 has it.
package signin

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"slices"
	"strings"
	"sync"
	"time"

	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/keys"
	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/members"
)

// The one scope the store's A2A endpoints need, and what it reads to a person.
const (
	StockScope      = "stock"
	StockScopeWords = "See Halide Supply's stock and your member prices"
)

// DeviceCodeGrant is the grant type of RFC 8628.
const DeviceCodeGrant = "urn:ietf:params:oauth:grant-type:device_code"

// The routes, under the server's issuer.
const (
	MetadataPath     = "/.well-known/oauth-authorization-server"
	RegistrationPath = "/oauth/register"
	DevicePath       = "/oauth/device"
	TokenPath        = "/oauth/token"
	RevocationPath   = "/oauth/revoke"
	PagePath         = "/device"
)

// How long each thing the server issues lives.
const (
	DeviceCodeLifetime   = 10 * time.Minute
	PollInterval         = 5 * time.Second
	AccessTokenLifetime  = time.Hour
	IDTokenLifetime      = time.Hour
	RefreshTokenLifetime = 30 * 24 * time.Hour
)

var grantTypes = []string{DeviceCodeGrant, "refresh_token"}

var scopes = []string{"openid", StockScope}

// Config is what the server is started with.
type Config struct {
	// Issuer is the server's own address, the store's base URL.
	Issuer string
	// PublicURL is the address a browser reaches the sign-in page at.
	PublicURL string
	// JWKSURL is the key set the ID token's key is published in.
	JWKSURL string
	// StateDir keeps the registered clients and the tokens.
	StateDir string
	// IDKey signs ID tokens.
	IDKey keys.Key
	// Now is the clock; time.Now when nil.
	Now func() time.Time
}

// Server is the authorization server.
type Server struct {
	cfg Config

	mu      sync.Mutex
	state   state
	pending map[string]*pending // by the device code's hash
	byUser  map[string]string   // user code -> the device code's hash
}

// New starts the server from what its state directory keeps.
func New(cfg Config) (*Server, error) {
	if cfg.Now == nil {
		cfg.Now = time.Now
	}
	st, err := loadState(cfg.StateDir)
	if err != nil {
		return nil, fmt.Errorf("reading the sign-in state: %w", err)
	}
	return &Server{cfg: cfg, state: st, pending: map[string]*pending{}, byUser: map[string]string{}}, nil
}

// Routes adds the server's routes to mux.
func (s *Server) Routes(mux *http.ServeMux) {
	mux.HandleFunc("GET "+MetadataPath, s.metadata)
	mux.HandleFunc("POST "+RegistrationPath, s.register)
	mux.HandleFunc("POST "+DevicePath, s.authorizeDevice)
	mux.HandleFunc("POST "+TokenPath, s.token)
	mux.HandleFunc("POST "+RevocationPath, s.revoke)
	mux.HandleFunc("GET "+PagePath, s.page)
	mux.HandleFunc("POST "+PagePath, s.decide)
}

// MetadataURL is where the server's metadata is read (RFC 8414).
func (s *Server) MetadataURL() string { return s.cfg.Issuer + MetadataPath }

// DeviceAuthorizationURL is the device authorization endpoint.
func (s *Server) DeviceAuthorizationURL() string { return s.cfg.Issuer + DevicePath }

// TokenURL is the token endpoint.
func (s *Server) TokenURL() string { return s.cfg.Issuer + TokenPath }

func (s *Server) metadata(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"issuer":                        s.cfg.Issuer,
		"device_authorization_endpoint": s.cfg.Issuer + DevicePath,
		"token_endpoint":                s.cfg.Issuer + TokenPath,
		"registration_endpoint":         s.cfg.Issuer + RegistrationPath,
		"revocation_endpoint":           s.cfg.Issuer + RevocationPath,
		"jwks_uri":                      s.cfg.JWKSURL,
		"scopes_supported":              scopes,
		"grant_types_supported":         grantTypes,
		// No authorization endpoint, so no response type.
		"response_types_supported":                   []string{},
		"token_endpoint_auth_methods_supported":      []string{"none"},
		"revocation_endpoint_auth_methods_supported": []string{"none"},
		"id_token_signing_alg_values_supported":      []string{"ES256"},
		"subject_types_supported":                    []string{"public"},
		"claims_supported":                           []string{"sub", "name", "email"},
	})
}

// register takes a public client's registration. A client asking a grant the server does not
// issue is refused; the redirect addresses and response types a client names are kept as given
// and used by nothing, since the server has no redirect.
func (s *Server) register(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ClientName              string   `json:"client_name"`
		GrantTypes              []string `json:"grant_types"`
		RedirectURIs            []string `json:"redirect_uris"`
		ResponseTypes           []string `json:"response_types"`
		TokenEndpointAuthMethod string   `json:"token_endpoint_auth_method"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		oauthError(w, http.StatusBadRequest, "invalid_client_metadata", "the registration is not JSON")
		return
	}
	if body.TokenEndpointAuthMethod != "" && body.TokenEndpointAuthMethod != "none" {
		oauthError(w, http.StatusBadRequest, "invalid_client_metadata", "only public clients are registered")
		return
	}
	grants := body.GrantTypes
	if len(grants) == 0 {
		grants = []string{DeviceCodeGrant}
	}
	for _, g := range grants {
		if !slices.Contains(grantTypes, g) {
			oauthError(w, http.StatusBadRequest, "invalid_client_metadata", fmt.Sprintf("the grant %q is not issued here", g))
			return
		}
	}
	name := strings.TrimSpace(body.ClientName)
	if name == "" {
		name = "An app"
	}
	id := "halide-client-" + random(12)
	now := s.cfg.Now()
	s.mu.Lock()
	s.state.Clients[id] = client{Name: name, Grants: grants, Redirect: body.RedirectURIs, Issued: now}
	err := s.state.save(s.cfg.StateDir, now)
	s.mu.Unlock()
	if err != nil {
		oauthError(w, http.StatusInternalServerError, "server_error", "the registration could not be kept")
		return
	}
	answer := map[string]any{
		"client_id":                  id,
		"client_id_issued_at":        now.Unix(),
		"client_name":                name,
		"grant_types":                grants,
		"token_endpoint_auth_method": "none",
	}
	if len(body.RedirectURIs) > 0 {
		answer["redirect_uris"] = body.RedirectURIs
	}
	if len(body.ResponseTypes) > 0 {
		answer["response_types"] = body.ResponseTypes
	}
	writeJSON(w, http.StatusCreated, answer)
}

// Authenticate is the member an access token was issued to, when it is live and carries the
// stock scope.
func (s *Server) Authenticate(token string) (members.Member, bool) {
	if token == "" {
		return members.Member{}, false
	}
	s.mu.Lock()
	g, ok := s.state.Access[hashToken(token)]
	s.mu.Unlock()
	if !ok || s.cfg.Now().After(g.Expires) || !slices.Contains(strings.Fields(g.Scope), StockScope) {
		return members.Member{}, false
	}
	return members.Find(g.Subject)
}

func random(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return base64.RawURLEncoding.EncodeToString(b)
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func oauthError(w http.ResponseWriter, status int, code, description string) {
	writeJSON(w, status, map[string]string{"error": code, "error_description": description})
}
