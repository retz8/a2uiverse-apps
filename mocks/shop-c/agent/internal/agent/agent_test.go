package agent

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"slices"
	"strings"
	"testing"
	"time"

	"github.com/a2aproject/a2a-go/v2/a2a"
	"github.com/a2aproject/a2a-go/v2/a2aclient"
	"github.com/a2aproject/a2a-go/v2/a2aclient/agentcard"
	"github.com/a2aproject/a2a-go/v2/a2acrypto"
	a2agrpc "github.com/a2aproject/a2a-go/v2/a2agrpc/v1"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/cards"
	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/keys"
	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/members"
	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/paint"
	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/signin"
	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/stock"
)

var bindings = []a2a.TransportProtocol{
	a2a.TransportProtocolGRPC,
	a2a.TransportProtocolHTTPJSON,
	a2a.TransportProtocolJSONRPC,
}

type running struct {
	base   string
	stock  *stock.Stock
	tokens map[string]string
}

// run starts the store on two free ports of this machine, with its state in a fresh directory,
// and signs both members in through its own sign-in.
func run(t *testing.T) *running {
	t.Helper()
	dir := t.TempDir()
	s, err := stock.Load(stock.DefaultPath())
	if err != nil {
		t.Fatal(err)
	}
	cardKey, err := keys.LoadOrCreate(dir, "card-key.pem")
	if err != nil {
		t.Fatal(err)
	}
	idKey, err := keys.LoadOrCreate(dir, "id-token-key.pem")
	if err != nil {
		t.Fatal(err)
	}
	httpListener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	grpcListener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	base := "http://" + httpListener.Addr().String()
	signIn, err := signin.New(signin.Config{
		Issuer: base, PublicURL: base, JWKSURL: base + cards.KeySetPath, StateDir: dir, IDKey: idKey,
	})
	if err != nil {
		t.Fatal(err)
	}
	c, err := cards.New(cards.Config{BaseURL: base, GRPCAddress: grpcListener.Addr().String(), SignIn: signIn, Key: cardKey})
	if err != nil {
		t.Fatal(err)
	}
	store := &Store{Stock: s, SignIn: signIn, Cards: c, KeySet: []keys.Key{cardKey, idKey}}
	handler := store.Handler()
	httpServer := &http.Server{Handler: store.HTTP(handler)}
	grpcServer := store.GRPC(handler)
	go func() { _ = httpServer.Serve(httpListener) }()
	go func() { _ = grpcServer.Serve(grpcListener) }()
	t.Cleanup(func() {
		grpcServer.Stop()
		_ = httpServer.Close()
	})
	r := &running{base: base, stock: s, tokens: map[string]string{}}
	for _, m := range members.All {
		token, err := signin.SignIn(http.DefaultClient, base, m, func(time.Duration) {})
		if err != nil {
			t.Fatal(err)
		}
		r.tokens[m.Subject] = token
	}
	return r
}

type withToken string

func (b withToken) Before(ctx context.Context, req *a2aclient.Request) (context.Context, any, error) {
	req.ServiceParams.Append("Authorization", "Bearer "+string(b))
	return ctx, nil, nil
}

func (withToken) After(context.Context, *a2aclient.Response) error { return nil }

// client is the Go A2A SDK's own client on one binding of the public card, sending token when
// one is given.
func (r *running) client(t *testing.T, binding a2a.TransportProtocol, token string) *a2aclient.Client {
	t.Helper()
	ctx := context.Background()
	card, err := agentcard.DefaultResolver.Resolve(ctx, r.base)
	if err != nil {
		t.Fatal(err)
	}
	var only []*a2a.AgentInterface
	for _, iface := range card.SupportedInterfaces {
		if iface.ProtocolBinding == binding {
			only = append(only, iface)
		}
	}
	if len(only) != 1 {
		t.Fatalf("the card lists %d %s interfaces", len(only), binding)
	}
	opts := []a2aclient.FactoryOption{a2agrpc.WithGRPCTransport(grpc.WithTransportCredentials(insecure.NewCredentials()))}
	if token != "" {
		opts = append(opts, a2aclient.WithCallInterceptors(withToken(token)))
	}
	client, err := a2aclient.NewFromEndpoints(ctx, only, opts...)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = client.Destroy() })
	return client
}

// send streams one message and reads the answer: exactly one message, holding one data part
// marked as A2UI, whose data is its list of messages.
func send(t *testing.T, client *a2aclient.Client, parts ...*a2a.Part) []map[string]any {
	t.Helper()
	msg := a2a.NewMessage(a2a.MessageRoleUser, parts...)
	msg.Metadata = map[string]any{"a2uiClientCapabilities": map[string]any{
		paint.Version: map[string]any{"supportedCatalogIds": []any{paint.BasicCatalogID}},
	}}
	var answers []*a2a.Message
	for event, err := range client.SendStreamingMessage(context.Background(), &a2a.SendMessageRequest{Message: msg}) {
		if err != nil {
			t.Fatal(err)
		}
		m, ok := event.(*a2a.Message)
		if !ok {
			t.Fatalf("the answer streamed a %T", event)
		}
		answers = append(answers, m)
	}
	if len(answers) != 1 || len(answers[0].Parts) != 1 {
		t.Fatalf("the answer is %d messages", len(answers))
	}
	part := answers[0].Parts[0]
	if part.Meta()["mimeType"] != paint.MIMEType {
		t.Fatalf("the part is marked %v", part.Meta())
	}
	list, ok := part.Data().([]any)
	if !ok {
		t.Fatalf("the part's data is %T, not a list", part.Data())
	}
	var messages []map[string]any
	for _, item := range list {
		messages = append(messages, item.(map[string]any))
	}
	return messages
}

func pressPart(name string, context map[string]any) *a2a.Part {
	return a2a.NewDataPart(map[string]any{
		"version": paint.Version,
		"action": map[string]any{
			"name": name, "surfaceId": paint.ListSurface, "sourceComponentId": "row",
			"timestamp": "2026-11-14T12:00:00Z", "context": context,
		},
	})
}

// items is the cameras an answer writes, at /items of the surface or as /items itself.
func items(t *testing.T, messages []map[string]any) []map[string]any {
	t.Helper()
	for _, m := range messages {
		update, ok := m["updateDataModel"].(map[string]any)
		if !ok {
			continue
		}
		var list []any
		switch update["path"] {
		case "/":
			list, _ = update["value"].(map[string]any)["items"].([]any)
		case "/items":
			list, _ = update["value"].([]any)
		}
		var out []map[string]any
		for _, item := range list {
			out = append(out, item.(map[string]any))
		}
		return out
	}
	t.Fatal("the answer writes no cameras")
	return nil
}

func ids(list []map[string]any) []string {
	var out []string
	for _, item := range list {
		out = append(out, item["id"].(string))
	}
	return out
}

func TestEveryBinding(t *testing.T) {
	r := run(t)
	mara, theo := r.tokens[members.All[0].Subject], r.tokens[members.All[1].Subject]
	for _, binding := range bindings {
		t.Run(string(binding), func(t *testing.T) {
			client := r.client(t, binding, theo)

			t.Run("a question paints the listing", func(t *testing.T) {
				messages := send(t, client, a2a.NewTextPart("What cameras do you have?"))
				if _, ok := messages[0]["createSurface"]; !ok {
					t.Fatalf("the first message is %v", messages[0])
				}
				if got, want := ids(items(t, messages)), ids(asMaps(r.stock.Listing(false))); !slices.Equal(got, want) {
					t.Fatalf("listed %v, not %v", got, want)
				}
			})
			t.Run("a question about returns paints the policy", func(t *testing.T) {
				messages := send(t, client, a2a.NewTextPart("What is your returns policy?"))
				if messages[0]["createSurface"].(map[string]any)["surfaceId"] != paint.PolicySurface {
					t.Fatalf("painted %v", messages[0])
				}
			})
			t.Run("a press opens one camera", func(t *testing.T) {
				messages := send(t, client, pressPart(paint.OpenCamera, map[string]any{"cameraId": "orbit-gm3", "view": "member"}))
				detail := messages[0]["updateDataModel"].(map[string]any)["value"].(map[string]any)["detail"].(map[string]any)
				if detail["id"] != "orbit-gm3" || detail["blurb"] == "" {
					t.Fatalf("opened %v", detail)
				}
			})
			t.Run("a press goes back to the list", func(t *testing.T) {
				messages := send(t, client, pressPart(paint.BackToList, map[string]any{"view": "member"}))
				if len(items(t, messages)) != 5 {
					t.Fatal("the list did not come back")
				}
			})
			t.Run("a press sorts by price and by rating", func(t *testing.T) {
				for _, key := range stock.SortKeys {
					messages := send(t, client, a2a.NewDataPart([]any{
						map[string]any{"version": paint.Version, "action": map[string]any{"name": paint.SortBy, "surfaceId": paint.ListSurface, "context": map[string]any{"key": key, "view": "member"}}},
					}))
					want, _ := r.stock.Sorted(key, false)
					if got := ids(items(t, messages)); !slices.Equal(got, ids(asMaps(want))) {
						t.Fatalf("sorted by %s: %v", key, got)
					}
				}
			})
			t.Run("trade prices for the trade member alone", func(t *testing.T) {
				trade := send(t, r.client(t, binding, mara), a2a.NewTextPart("What are my trade prices?"))
				if _, ok := items(t, trade)[0]["tradePrice"]; !ok {
					t.Fatal("the trade member was shown no trade price")
				}
				ordinary := send(t, client, a2a.NewTextPart("What are my trade prices?"))
				if _, ok := items(t, ordinary)[0]["tradePrice"]; ok {
					t.Fatal("the ordinary member was shown trade prices")
				}
				if !strings.Contains(mustJSON(t, ordinary), paint.TradeNote) {
					t.Fatal("the ordinary member was not told trade prices are for trade accounts")
				}
				pressed := send(t, client, pressPart(paint.OpenCamera, map[string]any{"cameraId": "orbit-gm3", "view": "trade"}))
				if strings.Contains(mustJSON(t, pressed), "tradePrice") {
					t.Fatal("a press naming the trade view showed the ordinary member trade prices")
				}
			})
			t.Run("refused without a token", func(t *testing.T) {
				anonymous := r.client(t, binding, "")
				msg := a2a.NewMessage(a2a.MessageRoleUser, a2a.NewTextPart("What cameras do you have?"))
				for _, err := range anonymous.SendStreamingMessage(context.Background(), &a2a.SendMessageRequest{Message: msg}) {
					if err == nil {
						t.Fatal("answered without a token")
					}
					if !refusedForSignIn(err) {
						t.Fatalf("refused with %v", err)
					}
					break
				}
				if _, err := anonymous.GetExtendedAgentCard(context.Background(), &a2a.GetExtendedAgentCardRequest{}); err == nil {
					t.Fatal("served a member's card without a token")
				}
			})
			t.Run("each member's card", func(t *testing.T) {
				for _, m := range members.All {
					card, err := r.client(t, binding, r.tokens[m.Subject]).GetExtendedAgentCard(context.Background(), &a2a.GetExtendedAgentCardRequest{})
					if err != nil {
						t.Fatal(err)
					}
					var skills []string
					for _, s := range card.Skills {
						skills = append(skills, s.ID)
					}
					want := []string{"browse-cameras", "store-policy"}
					if m.Trade {
						want = append(want, "trade-prices")
					}
					if !slices.Equal(skills, want) {
						t.Fatalf("%s's card lists %v", m.Name, skills)
					}
					r.verify(t, valueFlows(card))
				}
			})
		})
	}
}

// refusedForSignIn reads the refusal as the SDK's client reports it: unauthenticated on gRPC and
// HTTP+JSON, HTTP 401 on JSON-RPC, whose client names the status alone.
func refusedForSignIn(err error) bool {
	return errors.Is(err, a2a.ErrUnauthenticated) || strings.Contains(err.Error(), "401")
}

// The two HTTP bindings refuse a call with no token, or a token the store did not issue, with
// HTTP 401 and a Bearer challenge.
func TestTheHTTPBindingsAnswer401WithAChallenge(t *testing.T) {
	r := run(t)
	for _, path := range []string{cards.JSONRPCPath, cards.RESTPath + "/message:stream", cards.RESTPath + "/extendedAgentCard"} {
		for _, token := range []string{"", "not-one-the-store-issued"} {
			req, _ := http.NewRequest(http.MethodPost, r.base+path, strings.NewReader("{}"))
			req.Header.Set("Content-Type", "application/json")
			if token != "" {
				req.Header.Set("Authorization", "Bearer "+token)
			}
			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				t.Fatal(err)
			}
			resp.Body.Close()
			challenge := resp.Header.Get("WWW-Authenticate")
			if resp.StatusCode != http.StatusUnauthorized || !strings.HasPrefix(challenge, "Bearer ") {
				t.Fatalf("%s with %q: %d %q", path, token, resp.StatusCode, challenge)
			}
			if token != "" && !strings.Contains(challenge, `error="invalid_token"`) {
				t.Fatalf("%s: %q names no invalid token", path, challenge)
			}
		}
	}
}

// The public card lists gRPC, HTTP+JSON and JSON-RPC in that order, at A2A 1.0, offers device
// code as its one sign-in and requires it, names upstream's A2UI extension, and its signature
// passes the Go A2A SDK's own verifier over the card as served.
func TestThePublicCard(t *testing.T) {
	r := run(t)
	resp, err := http.Get(r.base + "/.well-known/agent-card.json")
	if err != nil {
		t.Fatal(err)
	}
	raw, _ := io.ReadAll(resp.Body)
	resp.Body.Close()
	var card a2a.AgentCard
	if err := json.Unmarshal(raw, &card); err != nil {
		t.Fatal(err)
	}
	var order []a2a.TransportProtocol
	for _, iface := range card.SupportedInterfaces {
		order = append(order, iface.ProtocolBinding)
		if iface.ProtocolVersion != "1.0" {
			t.Fatalf("%s is at A2A %s", iface.ProtocolBinding, iface.ProtocolVersion)
		}
	}
	if !slices.Equal(order, bindings) {
		t.Fatalf("the card lists %v", order)
	}
	scheme, ok := card.SecuritySchemes[cards.SchemeName].(a2a.OAuth2SecurityScheme)
	if !ok || len(card.SecuritySchemes) != 1 {
		t.Fatalf("the schemes are %v", card.SecuritySchemes)
	}
	if _, ok := scheme.Flows.(a2a.DeviceCodeOAuthFlow); !ok {
		t.Fatalf("the flow is %T", scheme.Flows)
	}
	if len(card.SecurityRequirements) != 1 {
		t.Fatalf("the requirements are %v", card.SecurityRequirements)
	}
	if !card.Capabilities.Streaming || !card.Capabilities.ExtendedAgentCard {
		t.Fatalf("the capabilities are %+v", card.Capabilities)
	}
	if len(card.Capabilities.Extensions) != 1 || card.Capabilities.Extensions[0].URI != cards.A2UIExtension {
		t.Fatalf("the extensions are %+v", card.Capabilities.Extensions)
	}
	r.verifyRaw(t, raw, card.Signatures)
}

func (r *running) verify(t *testing.T, card *a2a.AgentCard) {
	t.Helper()
	raw, err := json.Marshal(card)
	if err != nil {
		t.Fatal(err)
	}
	r.verifyRaw(t, raw, card.Signatures)
}

func (r *running) verifyRaw(t *testing.T, raw []byte, signatures []a2a.AgentCardSignature) {
	t.Helper()
	if len(signatures) != 1 {
		t.Fatalf("the card carries %d signatures", len(signatures))
	}
	verifier := a2acrypto.NewVerifier(a2acrypto.VerifierConfig{
		KeyResolver: a2acrypto.NewJWKSKeyResolver(http.DefaultClient, []string{r.base + cards.KeySetPath}),
	})
	if err := verifier.Verify(context.Background(), raw, &signatures[0]); err != nil {
		t.Fatalf("the signature does not pass: %v", err)
	}
}

// valueFlows is a card with its OAuth flow held by value. The Go A2A SDK's client reads a card
// over gRPC with the flow by pointer, which its own JSON writer refuses.
func valueFlows(card *a2a.AgentCard) *a2a.AgentCard {
	copied := *card
	copied.SecuritySchemes = a2a.NamedSecuritySchemes{}
	for name, scheme := range card.SecuritySchemes {
		if oauth, ok := scheme.(a2a.OAuth2SecurityScheme); ok {
			if flow, ok := oauth.Flows.(*a2a.DeviceCodeOAuthFlow); ok {
				oauth.Flows = *flow
				scheme = oauth
			}
		}
		copied.SecuritySchemes[name] = scheme
	}
	return &copied
}

func asMaps(list []stock.Camera) []map[string]any {
	var out []map[string]any
	for _, c := range list {
		out = append(out, map[string]any{"id": c.ID})
	}
	return out
}

func mustJSON(t *testing.T, v any) string {
	t.Helper()
	raw, err := json.Marshal(v)
	if err != nil {
		t.Fatal(err)
	}
	return string(raw)
}
