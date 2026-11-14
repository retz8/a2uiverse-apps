package signin

import (
	"crypto/rand"
	"math/big"
	"net/http"
	"net/url"
	"slices"
	"strings"
	"time"

	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/members"
)

// pending is one device authorization, from the code's issue to its exchange.
type pending struct {
	userCode string
	clientID string
	scope    string
	// hint is the member a login_hint fixed the sign-in to; empty when none did.
	hint     string
	expires  time.Time
	interval time.Duration
	lastAsk  time.Time
	// subject is the member who approved; refused is set when the member refused.
	subject string
	refused bool
}

// userCodeLetters are RFC 8628's suggested set: no vowels, so no words, and no letters a person
// mistakes for one another.
const userCodeLetters = "BCDFGHJKLMNPQRSTVWXZ"

func newUserCode() string {
	var b strings.Builder
	for i := range 8 {
		if i == 4 {
			b.WriteByte('-')
		}
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(userCodeLetters))))
		if err != nil {
			panic(err)
		}
		b.WriteByte(userCodeLetters[n.Int64()])
	}
	return b.String()
}

// normalCode is a typed code as issued: upper case, the dash put back, anything else dropped.
func normalCode(typed string) string {
	var letters []rune
	for _, r := range strings.ToUpper(typed) {
		if strings.ContainsRune(userCodeLetters, r) {
			letters = append(letters, r)
		}
	}
	if len(letters) != 8 {
		return strings.ToUpper(strings.TrimSpace(typed))
	}
	return string(letters[:4]) + "-" + string(letters[4:])
}

// authorizeDevice is the device authorization endpoint (RFC 8628, section 3.1). A login_hint
// naming a member the store knows, by subject or email, fixes the sign-in to that member.
func (s *Server) authorizeDevice(w http.ResponseWriter, r *http.Request) {
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
	if !slices.Contains(c.Grants, DeviceCodeGrant) {
		oauthError(w, http.StatusBadRequest, "unauthorized_client", "this client did not register the device grant")
		return
	}
	asked := strings.Fields(r.PostForm.Get("scope"))
	if len(asked) == 0 {
		asked = []string{StockScope}
	}
	for _, scope := range asked {
		if !slices.Contains(scopes, scope) {
			oauthError(w, http.StatusBadRequest, "invalid_scope", "the scope "+scope+" is not issued here")
			return
		}
	}
	hint := ""
	if m, ok := members.Find(r.PostForm.Get("login_hint")); ok {
		hint = m.Subject
	}
	deviceCode := random(32)
	now := s.cfg.Now()
	p := &pending{
		clientID: clientID,
		scope:    strings.Join(asked, " "),
		hint:     hint,
		expires:  now.Add(DeviceCodeLifetime),
		interval: PollInterval,
	}
	s.mu.Lock()
	for {
		p.userCode = newUserCode()
		if _, taken := s.byUser[p.userCode]; !taken {
			break
		}
	}
	s.pending[hashToken(deviceCode)] = p
	s.byUser[p.userCode] = hashToken(deviceCode)
	s.mu.Unlock()
	page := s.cfg.PublicURL + PagePath
	writeJSON(w, http.StatusOK, map[string]any{
		"device_code":               deviceCode,
		"user_code":                 p.userCode,
		"verification_uri":          page,
		"verification_uri_complete": page + "?code=" + url.QueryEscape(p.userCode),
		"expires_in":                int(DeviceCodeLifetime.Seconds()),
		"interval":                  int(PollInterval.Seconds()),
	})
}

// awaiting is the pending authorization a user code names, while it is neither decided nor
// expired.
func (s *Server) awaiting(userCode string) (*pending, string, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	hash, ok := s.byUser[userCode]
	if !ok {
		return nil, "", false
	}
	p := s.pending[hash]
	if p == nil || p.subject != "" || p.refused || s.cfg.Now().After(p.expires) {
		return nil, "", false
	}
	name := s.state.Clients[p.clientID].Name
	return p, name, true
}

// page is Shop C's sign-in page. With the code in its address it shows the code back to be
// checked; without one it asks for the code to be typed.
func (s *Server) page(w http.ResponseWriter, r *http.Request) {
	typed := r.URL.Query().Get("code")
	if typed == "" {
		render(w, http.StatusOK, enterCode{})
		return
	}
	code := normalCode(typed)
	p, clientName, ok := s.awaiting(code)
	if !ok {
		render(w, http.StatusOK, enterCode{Typed: typed, Unknown: true})
		return
	}
	render(w, http.StatusOK, approve{Code: code, ClientName: clientName, Members: choices(p.hint)})
}

// decide takes Approve or Refuse for a code, as the member chosen.
func (s *Server) decide(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		render(w, http.StatusBadRequest, enterCode{})
		return
	}
	code := normalCode(r.PostForm.Get("code"))
	p, clientName, ok := s.awaiting(code)
	if !ok {
		render(w, http.StatusOK, enterCode{Typed: code, Unknown: true})
		return
	}
	if r.PostForm.Get("decision") == "refuse" {
		s.mu.Lock()
		p.refused = true
		s.mu.Unlock()
		render(w, http.StatusOK, done{ClientName: clientName, Refused: true})
		return
	}
	m, ok := members.Find(r.PostForm.Get("member"))
	if !ok || (p.hint != "" && m.Subject != p.hint) {
		render(w, http.StatusOK, approve{Code: code, ClientName: clientName, Members: choices(p.hint), NoMember: true})
		return
	}
	s.mu.Lock()
	p.subject = m.Subject
	s.mu.Unlock()
	render(w, http.StatusOK, done{ClientName: clientName, Member: m.Name})
}

type choice struct {
	members.Member
	Fixed bool
}

// choices are the members the page lists: both, or the one a login_hint fixed.
func choices(hint string) []choice {
	var list []choice
	for _, m := range members.All {
		if hint == "" || m.Subject == hint {
			list = append(list, choice{Member: m, Fixed: hint != ""})
		}
	}
	return list
}
