// Package agent serves Halide Supply over A2A 1.0 from one request handler of the Go A2A SDK, on
// gRPC, HTTP+JSON and JSON-RPC. Every A2A call needs an access token the store's own
// authorization server issued: refused with HTTP 401 on the two HTTP bindings and with the gRPC
// status UNAUTHENTICATED on gRPC. A signed-in member is served their own card.
package agent

import (
	"context"
	"encoding/json"
	"errors"
	"iter"
	"net"
	"net/http"
	"strings"

	"github.com/a2aproject/a2a-go/v2/a2a"
	a2agrpc "github.com/a2aproject/a2a-go/v2/a2agrpc/v1"
	"github.com/a2aproject/a2a-go/v2/a2asrv"
	"google.golang.org/grpc"

	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/cards"
	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/keys"
	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/members"
	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/paint"
	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/signin"
	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/stock"
)

// Store is everything the servers answer from.
type Store struct {
	Stock  *stock.Stock
	SignIn *signin.Server
	Cards  *cards.Cards
	// KeySet is every key the store publishes: the cards' and the ID tokens'.
	KeySet []keys.Key
}

// Handler is the one request handler every binding is served from.
func (s *Store) Handler() a2asrv.RequestHandler {
	return a2asrv.NewHandler(
		a2asrv.AgentExecutorFunc(s.execute),
		a2asrv.WithCallInterceptors(&credentialCheck{signIn: s.SignIn}),
		a2asrv.WithExtendedAgentCardProducer(a2asrv.ExtendedAgentCardProducerFn(s.memberCard)),
	)
}

// execute answers one message with one message, whose one data part holds its A2UI.
func (s *Store) execute(_ context.Context, ec *a2asrv.ExecutorContext) iter.Seq2[a2a.Event, error] {
	return func(yield func(a2a.Event, error) bool) {
		m, ok := memberOf(ec.User)
		if !ok {
			yield(nil, a2a.ErrUnauthenticated)
			return
		}
		var parts []*a2a.Part
		if ec.Message != nil {
			parts = ec.Message.Parts
		}
		answer := a2a.NewMessage(a2a.MessageRoleAgent, paint.Part(Answer(s.Stock, m, parts)))
		answer.ContextID = ec.ContextID
		yield(answer, nil)
	}
}

func (s *Store) memberCard(ctx context.Context, _ *a2a.GetExtendedAgentCardRequest) (*a2a.AgentCard, error) {
	call, _ := a2asrv.CallContextFrom(ctx)
	var user *a2asrv.User
	if call != nil {
		user = call.User
	}
	m, ok := memberOf(user)
	if !ok {
		return nil, a2a.ErrUnauthenticated
	}
	return s.Cards.Member(ctx, m)
}

func memberOf(user *a2asrv.User) (members.Member, bool) {
	if user == nil || !user.Authenticated {
		return members.Member{}, false
	}
	return members.Find(user.Name)
}

// bearer is the token an Authorization value carries, empty when it carries none.
func bearer(values []string) string {
	for _, v := range values {
		scheme, token, ok := strings.Cut(strings.TrimSpace(v), " ")
		if ok && strings.EqualFold(scheme, "Bearer") {
			return strings.TrimSpace(token)
		}
	}
	return ""
}

// credentialCheck runs before every A2A call on every binding, the extended card's included: it
// names the member the call's token was issued to, and refuses a call with none as
// unauthenticated, which gRPC answers UNAUTHENTICATED.
type credentialCheck struct {
	a2asrv.PassthroughCallInterceptor
	signIn *signin.Server
}

func (c *credentialCheck) Before(ctx context.Context, call *a2asrv.CallContext, _ *a2asrv.Request) (context.Context, any, error) {
	values, _ := call.ServiceParams().Get("authorization")
	m, ok := c.signIn.Authenticate(bearer(values))
	if !ok {
		return ctx, nil, a2a.ErrUnauthenticated
	}
	call.User = a2asrv.NewAuthenticatedUser(m.Subject, nil)
	return ctx, nil, nil
}

// requireToken refuses an HTTP request with no live token before the binding reads it: HTTP 401
// with a Bearer challenge, as RFC 6750 has it, on JSON-RPC and HTTP+JSON alike.
func (s *Store) requireToken(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := bearer(r.Header.Values("Authorization"))
		if _, ok := s.SignIn.Authenticate(token); !ok {
			challenge := `Bearer realm="Halide Supply", scope="` + signin.StockScope + `"`
			if token != "" {
				challenge += `, error="invalid_token"`
			}
			w.Header().Set("WWW-Authenticate", challenge)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			_, _ = w.Write([]byte(`{"error":"invalid_token","error_description":"Sign in to Halide Supply to use this."}` + "\n"))
			return
		}
		next.ServeHTTP(w, r)
	})
}

// HTTP is the store's HTTP port: the public card and the key set, the sign-in routes, JSON-RPC
// and HTTP+JSON.
func (s *Store) HTTP(handler a2asrv.RequestHandler) http.Handler {
	mux := http.NewServeMux()
	public := a2asrv.NewSignedCardProducer(a2asrv.AgentCardProducerFn(s.Cards.Public), s.Cards.Signers)
	mux.Handle("GET "+a2asrv.WellKnownAgentCardPath, a2asrv.NewAgentCardHandler(public))
	mux.HandleFunc("GET "+cards.KeySetPath, func(w http.ResponseWriter, _ *http.Request) {
		writeKeySet(w, keys.Set(s.KeySet...))
	})
	s.SignIn.Routes(mux)
	mux.Handle(cards.JSONRPCPath, s.requireToken(a2asrv.NewJSONRPCHandler(handler)))
	mux.Handle(cards.RESTPath+"/", s.requireToken(http.StripPrefix(cards.RESTPath, a2asrv.NewRESTHandler(handler))))
	return mux
}

// GRPC is the store's gRPC server.
func (s *Store) GRPC(handler a2asrv.RequestHandler) *grpc.Server {
	server := grpc.NewServer()
	a2agrpc.NewHandler(pointerFlows{handler}).RegisterWith(server)
	return server
}

// pointerFlows hands the gRPC binding each member's card with its OAuth flow by pointer. The Go
// A2A SDK writes a card's JSON from a flow held by value and converts it to protobuf only from a
// flow held by pointer, so one card cannot serve both.
type pointerFlows struct {
	a2asrv.RequestHandler
}

func (h pointerFlows) GetExtendedAgentCard(ctx context.Context, req *a2a.GetExtendedAgentCardRequest) (*a2a.AgentCard, error) {
	card, err := h.RequestHandler.GetExtendedAgentCard(ctx, req)
	if err != nil {
		return nil, err
	}
	schemes := a2a.NamedSecuritySchemes{}
	for name, scheme := range card.SecuritySchemes {
		if oauth, ok := scheme.(a2a.OAuth2SecurityScheme); ok {
			if flow, ok := oauth.Flows.(a2a.DeviceCodeOAuthFlow); ok {
				oauth.Flows = &flow
				scheme = oauth
			}
		}
		schemes[name] = scheme
	}
	copied := *card
	copied.SecuritySchemes = schemes
	return &copied, nil
}

// Serve runs both servers until one stops.
func Serve(httpListener, grpcListener net.Listener, httpHandler http.Handler, grpcServer *grpc.Server) error {
	errs := make(chan error, 2)
	go func() { errs <- http.Serve(httpListener, httpHandler) }()
	go func() { errs <- grpcServer.Serve(grpcListener) }()
	err := <-errs
	if errors.Is(err, http.ErrServerClosed) || errors.Is(err, grpc.ErrServerStopped) {
		return nil
	}
	return err
}

func writeKeySet(w http.ResponseWriter, set map[string]any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-cache")
	_ = json.NewEncoder(w).Encode(set)
}
