package signin

import (
	"crypto/ecdsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"io"
	"math/big"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/keys"
	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/members"
)

var (
	mara = members.All[0]
	theo = members.All[1]
)

type clock struct {
	mu  sync.Mutex
	now time.Time
}

func (c *clock) Now() time.Time {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.now
}

func (c *clock) advance(d time.Duration) {
	c.mu.Lock()
	c.now = c.now.Add(d)
	c.mu.Unlock()
}

type harness struct {
	t      *testing.T
	server *Server
	http   *httptest.Server
	clock  *clock
	dir    string
	idKey  keys.Key
}

func start(t *testing.T, dir string) *harness {
	t.Helper()
	if dir == "" {
		dir = t.TempDir()
	}
	idKey, err := keys.LoadOrCreate(dir, "id-token-key.pem")
	if err != nil {
		t.Fatal(err)
	}
	h := &harness{t: t, clock: &clock{now: time.Date(2026, 11, 14, 12, 0, 0, 0, time.UTC)}, dir: dir, idKey: idKey}
	mux := http.NewServeMux()
	h.http = httptest.NewServer(mux)
	t.Cleanup(h.http.Close)
	h.server, err = New(Config{
		Issuer: h.http.URL, PublicURL: "https://store.example.test", JWKSURL: h.http.URL + "/jwks",
		StateDir: dir, IDKey: idKey, Now: h.clock.Now,
	})
	if err != nil {
		t.Fatal(err)
	}
	h.server.Routes(mux)
	return h
}

func (h *harness) do(method, path, contentType, body string) (int, map[string]any, string) {
	h.t.Helper()
	req, _ := http.NewRequest(method, h.http.URL+path, strings.NewReader(body))
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		h.t.Fatal(err)
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)
	var out map[string]any
	_ = json.Unmarshal(raw, &out)
	return resp.StatusCode, out, string(raw)
}

func (h *harness) form(path string, values url.Values) (int, map[string]any, string) {
	return h.do(http.MethodPost, path, "application/x-www-form-urlencoded", values.Encode())
}

// register registers a client as the vault does: a redirect address and a code response type it
// will not use, beside the two grants the server lists.
func (h *harness) register() string {
	h.t.Helper()
	status, body, raw := h.do(http.MethodPost, RegistrationPath, "application/json", `{
		"client_name": "A2UIVerse", "redirect_uris": ["http://localhost:10001/vault/return"],
		"grant_types": ["refresh_token", "urn:ietf:params:oauth:grant-type:device_code"],
		"response_types": ["code"], "token_endpoint_auth_method": "none"}`)
	if status != http.StatusCreated {
		h.t.Fatalf("registration: %d %s", status, raw)
	}
	return body["client_id"].(string)
}

type device struct{ code, user, complete, page string }

func (h *harness) authorize(clientID string, extra url.Values) device {
	h.t.Helper()
	values := url.Values{"client_id": {clientID}, "scope": {"openid stock"}}
	for k, v := range extra {
		values[k] = v
	}
	status, body, raw := h.form(DevicePath, values)
	if status != http.StatusOK {
		h.t.Fatalf("device authorization: %d %s", status, raw)
	}
	return device{
		code: body["device_code"].(string), user: body["user_code"].(string),
		complete: body["verification_uri_complete"].(string), page: body["verification_uri"].(string),
	}
}

func (h *harness) decide(user, member, decision string) string {
	h.t.Helper()
	_, _, raw := h.form(PagePath, url.Values{"code": {user}, "member": {member}, "decision": {decision}})
	return raw
}

func (h *harness) exchange(clientID, deviceCode string) (int, map[string]any) {
	h.t.Helper()
	status, body, _ := h.form(TokenPath, url.Values{"grant_type": {DeviceCodeGrant}, "device_code": {deviceCode}, "client_id": {clientID}})
	return status, body
}

func TestMetadataNamesEveryEndpointAndDynamicRegistrationAlone(t *testing.T) {
	h := start(t, "")
	status, body, _ := h.do(http.MethodGet, MetadataPath, "", "")
	if status != http.StatusOK || body["issuer"] != h.http.URL {
		t.Fatalf("%d %v", status, body)
	}
	for field, path := range map[string]string{
		"device_authorization_endpoint": DevicePath, "token_endpoint": TokenPath,
		"registration_endpoint": RegistrationPath, "revocation_endpoint": RevocationPath,
	} {
		if body[field] != h.http.URL+path {
			t.Errorf("%s is %v", field, body[field])
		}
	}
	if _, ok := body["client_id_metadata_document_supported"]; ok {
		t.Error("the metadata offers a client ID metadata document")
	}
	if _, ok := body["authorization_endpoint"]; ok {
		t.Error("the metadata names an authorization endpoint; device code is the one sign-in")
	}
	if !strings.Contains(strings.Join(toStrings(body["scopes_supported"]), " "), "openid") {
		t.Error("openid is not among the scopes, so no ID token would be asked for")
	}
}

func toStrings(v any) []string {
	var out []string
	for _, s := range v.([]any) {
		out = append(out, s.(string))
	}
	return out
}

func TestRegistrationRefusesWhatTheServerDoesNotIssue(t *testing.T) {
	h := start(t, "")
	for name, body := range map[string]string{
		"a grant not issued":    `{"client_name": "x", "grant_types": ["authorization_code"]}`,
		"a confidential client": `{"client_name": "x", "token_endpoint_auth_method": "client_secret_basic"}`,
		"no JSON":               `client_name=x`,
	} {
		t.Run(name, func(t *testing.T) {
			status, out, _ := h.do(http.MethodPost, RegistrationPath, "application/json", body)
			if status != http.StatusBadRequest || out["error"] != "invalid_client_metadata" {
				t.Fatalf("%d %v", status, out)
			}
		})
	}
}

// The device grant from start to finish: the code shown back on the page, approved as a member,
// exchanged once for an access token, a refresh token and an ID token naming the member.
func TestTheDeviceGrantThroughApproval(t *testing.T) {
	h := start(t, "")
	client := h.register()
	d := h.authorize(client, nil)
	if d.page != "https://store.example.test"+PagePath || d.complete != d.page+"?code="+url.QueryEscape(d.user) {
		t.Fatalf("the addresses are %q and %q", d.page, d.complete)
	}
	_, _, page := h.do(http.MethodGet, PagePath+"?code="+url.QueryEscape(d.user), "", "")
	for _, words := range []string{d.user, mara.Account(), theo.Name, "Signing in lets A2UIVerse see Halide Supply's stock", "Approve", "Refuse"} {
		if !strings.Contains(page, words) {
			t.Errorf("the page lacks %q", words)
		}
	}
	if status, body := h.exchange(client, d.code); status != http.StatusBadRequest || body["error"] != "authorization_pending" {
		t.Fatalf("before approval: %d %v", status, body)
	}
	if done := h.decide(d.user, mara.Subject, "approve"); !strings.Contains(done, "signed in to Halide Supply as Mara Okafor") {
		t.Fatalf("the page answered %s", done)
	}
	h.clock.advance(PollInterval)
	status, body := h.exchange(client, d.code)
	if status != http.StatusOK || body["token_type"] != "Bearer" || body["refresh_token"] == nil {
		t.Fatalf("%d %v", status, body)
	}
	if m, ok := h.server.Authenticate(body["access_token"].(string)); !ok || m.Subject != mara.Subject {
		t.Fatalf("the access token names %v, %v", m, ok)
	}
	h.checkIDToken(body["id_token"].(string), client, mara)
	if status, body := h.exchange(client, d.code); status != http.StatusBadRequest || body["error"] != "invalid_grant" {
		t.Fatalf("a code exchanged twice: %d %v", status, body)
	}
}

func (h *harness) checkIDToken(token, clientID string, m members.Member) {
	h.t.Helper()
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		h.t.Fatalf("the ID token is not a JWS: %q", token)
	}
	var header map[string]string
	raw, _ := base64.RawURLEncoding.DecodeString(parts[0])
	_ = json.Unmarshal(raw, &header)
	if header["alg"] != "ES256" || header["kid"] != h.idKey.ID {
		h.t.Fatalf("the header is %v", header)
	}
	sig, _ := base64.RawURLEncoding.DecodeString(parts[2])
	sum := sha256.Sum256([]byte(parts[0] + "." + parts[1]))
	r, s := new(big.Int).SetBytes(sig[:32]), new(big.Int).SetBytes(sig[32:])
	if !ecdsa.Verify(&h.idKey.Private.PublicKey, sum[:], r, s) {
		h.t.Fatal("the ID token's signature does not hold")
	}
	var claims map[string]any
	raw, _ = base64.RawURLEncoding.DecodeString(parts[1])
	_ = json.Unmarshal(raw, &claims)
	if claims["iss"] != h.http.URL || claims["sub"] != m.Subject || claims["aud"] != clientID ||
		claims["email"] != m.Email || claims["name"] != m.Name {
		h.t.Fatalf("the claims are %v", claims)
	}
	if exp := int64(claims["exp"].(float64)); exp != h.clock.Now().Add(IDTokenLifetime).Unix() {
		h.t.Fatalf("exp is %d", exp)
	}
}

func TestARefusalOnThePageIsAccessDenied(t *testing.T) {
	h := start(t, "")
	client := h.register()
	d := h.authorize(client, nil)
	if done := h.decide(d.user, "", "refuse"); !strings.Contains(done, "Sign-in refused") {
		t.Fatalf("the page answered %s", done)
	}
	if status, body := h.exchange(client, d.code); status != http.StatusBadRequest || body["error"] != "access_denied" {
		t.Fatalf("%d %v", status, body)
	}
}

func TestAnExpiredCodeIsExpiredToken(t *testing.T) {
	h := start(t, "")
	client := h.register()
	d := h.authorize(client, nil)
	h.clock.advance(DeviceCodeLifetime + time.Second)
	_, _, page := h.do(http.MethodGet, PagePath+"?code="+url.QueryEscape(d.user), "", "")
	if !strings.Contains(page, "isn't one Halide Supply is waiting for") {
		t.Fatalf("the page took an expired code: %s", page)
	}
	if status, body := h.exchange(client, d.code); status != http.StatusBadRequest || body["error"] != "expired_token" {
		t.Fatalf("%d %v", status, body)
	}
}

// Asked again before the interval has passed, the server answers slow_down and waits five
// seconds more from then on (RFC 8628, section 3.5).
func TestBeingAskedTooFastIsSlowDown(t *testing.T) {
	h := start(t, "")
	client := h.register()
	d := h.authorize(client, nil)
	ask := func() string {
		_, body := h.exchange(client, d.code)
		return body["error"].(string)
	}
	if got := ask(); got != "authorization_pending" {
		t.Fatal(got)
	}
	h.clock.advance(time.Second)
	if got := ask(); got != "slow_down" {
		t.Fatal(got)
	}
	h.clock.advance(2 * PollInterval)
	if got := ask(); got != "authorization_pending" {
		t.Fatalf("asked after the widened interval: %s", got)
	}
	h.clock.advance(PollInterval)
	if got := ask(); got != "slow_down" {
		t.Fatalf("asked after the first interval, inside the widened one: %s", got)
	}
}

func TestALoginHintFixesThePageToThatMember(t *testing.T) {
	h := start(t, "")
	client := h.register()
	d := h.authorize(client, url.Values{"login_hint": {mara.Subject}})
	_, _, page := h.do(http.MethodGet, PagePath+"?code="+url.QueryEscape(d.user), "", "")
	if !strings.Contains(page, mara.Name) || strings.Contains(page, theo.Name) {
		t.Fatal("the page does not list the hinted member alone")
	}
	if done := h.decide(d.user, theo.Subject, "approve"); !strings.Contains(done, "Choose an account") {
		t.Fatalf("another member approved a hinted sign-in: %s", done)
	}
	if done := h.decide(d.user, mara.Subject, "approve"); !strings.Contains(done, "as Mara Okafor") {
		t.Fatal(done)
	}
}

func TestTheBarePageAsksForTheCodeAndTakesItTypedLoosely(t *testing.T) {
	h := start(t, "")
	_, _, bare := h.do(http.MethodGet, PagePath, "", "")
	if !strings.Contains(bare, "Enter the code you were shown") {
		t.Fatal(bare)
	}
	d := h.authorize(h.register(), nil)
	typed := strings.ToLower(strings.ReplaceAll(d.user, "-", " "))
	_, _, page := h.do(http.MethodGet, PagePath+"?code="+url.QueryEscape(typed), "", "")
	if !strings.Contains(page, d.user) || !strings.Contains(page, "Approve") {
		t.Fatalf("the typed code %q was not taken", typed)
	}
}

func (h *harness) signIn(m members.Member) (client string, tokens map[string]any) {
	h.t.Helper()
	client = h.register()
	d := h.authorize(client, nil)
	h.decide(d.user, m.Subject, "approve")
	status, tokens := h.exchange(client, d.code)
	if status != http.StatusOK {
		h.t.Fatalf("%d %v", status, tokens)
	}
	return client, tokens
}

func TestRefreshIssuesANewAccessTokenAndAnIDToken(t *testing.T) {
	h := start(t, "")
	client, tokens := h.signIn(theo)
	h.clock.advance(AccessTokenLifetime + time.Minute)
	if _, ok := h.server.Authenticate(tokens["access_token"].(string)); ok {
		t.Fatal("an expired access token still signs in")
	}
	status, fresh, _ := h.form(TokenPath, url.Values{"grant_type": {"refresh_token"}, "refresh_token": {tokens["refresh_token"].(string)}, "client_id": {client}})
	if status != http.StatusOK {
		t.Fatalf("%d %v", status, fresh)
	}
	if m, ok := h.server.Authenticate(fresh["access_token"].(string)); !ok || m.Subject != theo.Subject {
		t.Fatal("the refreshed access token does not sign in")
	}
	h.checkIDToken(fresh["id_token"].(string), client, theo)
	if _, ok := fresh["refresh_token"]; ok {
		t.Fatal("the refresh token was rotated")
	}
	status, other, _ := h.form(TokenPath, url.Values{"grant_type": {"refresh_token"}, "refresh_token": {tokens["refresh_token"].(string)}, "client_id": {h.register()}})
	if status != http.StatusBadRequest || other["error"] != "invalid_grant" {
		t.Fatalf("another client refreshed: %d %v", status, other)
	}
}

func TestRevokingTheRefreshTokenRevokesItsAccessTokens(t *testing.T) {
	h := start(t, "")
	client, tokens := h.signIn(mara)
	status, _, _ := h.form(RevocationPath, url.Values{"token": {tokens["refresh_token"].(string)}, "token_type_hint": {"refresh_token"}, "client_id": {client}})
	if status != http.StatusOK {
		t.Fatal(status)
	}
	if _, ok := h.server.Authenticate(tokens["access_token"].(string)); ok {
		t.Fatal("an access token outlived its revoked refresh token")
	}
	status, body, _ := h.form(TokenPath, url.Values{"grant_type": {"refresh_token"}, "refresh_token": {tokens["refresh_token"].(string)}, "client_id": {client}})
	if status != http.StatusBadRequest || body["error"] != "invalid_grant" {
		t.Fatalf("%d %v", status, body)
	}
	if status, _, _ := h.form(RevocationPath, url.Values{"token": {"never-issued"}, "client_id": {client}}); status != http.StatusOK {
		t.Fatalf("an unknown token answered %d", status)
	}
}

// A restart keeps the members signed in; a server whose state directory was deleted no longer
// knows the client, answers invalid_client, and takes a new registration.
func TestARestartKeepsTokensAndALostStateForgetsTheClient(t *testing.T) {
	dir := t.TempDir()
	h := start(t, dir)
	client, tokens := h.signIn(mara)
	again := start(t, dir)
	if m, ok := again.server.Authenticate(tokens["access_token"].(string)); !ok || m.Subject != mara.Subject {
		t.Fatal("a restart signed the member out")
	}
	if err := os.RemoveAll(dir); err != nil {
		t.Fatal(err)
	}
	lost := start(t, dir)
	status, body, _ := lost.form(DevicePath, url.Values{"client_id": {client}, "scope": {"stock"}})
	if status != http.StatusUnauthorized || body["error"] != "invalid_client" {
		t.Fatalf("%d %v", status, body)
	}
	if _, ok := lost.server.Authenticate(tokens["access_token"].(string)); ok {
		t.Fatal("a lost state still signs the member in")
	}
	lost.signIn(mara)
}

func TestATokenWithoutTheStockScopeSignsNothingIn(t *testing.T) {
	h := start(t, "")
	client := h.register()
	d := h.authorize(client, url.Values{"scope": {"openid"}})
	h.decide(d.user, mara.Subject, "approve")
	_, tokens := h.exchange(client, d.code)
	if _, ok := h.server.Authenticate(tokens["access_token"].(string)); ok {
		t.Fatal("a token without the stock scope signed in")
	}
}
