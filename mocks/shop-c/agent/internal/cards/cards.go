// Package cards writes Halide Supply's agent cards: the public card, and the card it serves each
// signed-in member, which lists the same interfaces and differs only in its skills. Each card is
// signed by the Go A2A SDK's signer with the store's own key, whose key set the store serves on
// its own origin.
package cards

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"

	"github.com/a2aproject/a2a-go/v2/a2a"
	"github.com/a2aproject/a2a-go/v2/a2acrypto"

	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/keys"
	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/members"
	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/paint"
	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/signin"
)

// Order is the order the card lists the store's three interfaces in. It is set here and nowhere
// else; another order is run by editing this list.
var Order = []a2a.TransportProtocol{
	a2a.TransportProtocolGRPC,
	a2a.TransportProtocolHTTPJSON,
	a2a.TransportProtocolJSONRPC,
}

// The paths the two HTTP bindings answer under, beside the card and the sign-in routes.
const (
	RESTPath    = "/rest"
	JSONRPCPath = "/jsonrpc"
	KeySetPath  = "/.well-known/jwks.json"
)

// A2UIExtension is upstream's A2UI extension for A2A at the version Shop C paints.
const A2UIExtension = "https://a2ui.org/a2a-extension/a2ui/v0.9.1"

// SchemeName is the card's one sign-in scheme.
const SchemeName = "halide-membership"

// Version is the card's version.
const Version = "0.1.0"

// Config is where the store answers.
type Config struct {
	// BaseURL is the store's address on its card, its HTTP port.
	BaseURL string
	// GRPCAddress is its gRPC address, host and port.
	GRPCAddress string
	// SignIn is the store's authorization server.
	SignIn *signin.Server
	// Key signs every card.
	Key keys.Key
}

// Cards writes and signs the store's cards.
type Cards struct {
	cfg    Config
	signer *a2acrypto.Signer
}

// New makes the cards' signer.
func New(cfg Config) (*Cards, error) {
	signer, err := a2acrypto.NewSigner(a2acrypto.SignerConfig{
		PrivateKey: cfg.Key.Private,
		KeyID:      cfg.Key.ID,
		Algorithm:  "ES256",
		JWKSURL:    cfg.BaseURL + KeySetPath,
	})
	if err != nil {
		return nil, fmt.Errorf("making the card's signer: %w", err)
	}
	return &Cards{cfg: cfg, signer: signer}, nil
}

// Signers are the signers the public card is signed with.
func (c *Cards) Signers(context.Context) ([]*a2acrypto.Signer, error) {
	return []*a2acrypto.Signer{c.signer}, nil
}

// Public is the public card, unsigned; the store serves it through the SDK's signed-card producer.
func (c *Cards) Public(context.Context) (*a2a.AgentCard, error) {
	return c.card(publicSkills()), nil
}

// Member is the card the store serves a signed-in member, signed: the public card's skills, and
// for a trade account the trade prices beside them.
func (c *Cards) Member(ctx context.Context, m members.Member) (*a2a.AgentCard, error) {
	skills := publicSkills()
	if m.Trade {
		skills = append(skills, tradeSkill)
	}
	card := c.card(skills)
	raw, err := json.Marshal(card)
	if err != nil {
		return nil, err
	}
	sig, err := c.signer.Sign(ctx, raw)
	if err != nil {
		return nil, fmt.Errorf("signing the member's card: %w", err)
	}
	card.Signatures = []a2a.AgentCardSignature{*sig}
	return card, nil
}

func (c *Cards) interfaces() []*a2a.AgentInterface {
	address := map[a2a.TransportProtocol]string{
		a2a.TransportProtocolGRPC:     c.cfg.GRPCAddress,
		a2a.TransportProtocolHTTPJSON: c.cfg.BaseURL + RESTPath,
		a2a.TransportProtocolJSONRPC:  c.cfg.BaseURL + JSONRPCPath,
	}
	list := make([]*a2a.AgentInterface, len(Order))
	for i, binding := range Order {
		list[i] = a2a.NewAgentInterface(address[binding], binding)
	}
	return list
}

func (c *Cards) card(skills []a2a.AgentSkill) *a2a.AgentCard {
	return &a2a.AgentCard{
		Name:                "Shop C",
		Description:         "Halide Supply, a members' warehouse for working photographers. Members sign in to see its cameras with their member prices, and trade accounts see trade prices too.",
		Version:             Version,
		Provider:            &a2a.AgentProvider{Org: "Halide Supply", URL: "https://halide-supply.example"},
		DocumentationURL:    "https://github.com/retz8/a2uiverse-apps/blob/main/mocks/shop-c/README.md",
		SupportedInterfaces: c.interfaces(),
		Capabilities: a2a.AgentCapabilities{
			Streaming:         true,
			ExtendedAgentCard: true,
			Extensions: []a2a.AgentExtension{{
				URI:         A2UIExtension,
				Description: "Answers in A2UI v0.9.1, in the basic catalog",
				Params:      map[string]any{"supportedCatalogIds": []any{paint.BasicCatalogID}},
			}},
		},
		DefaultInputModes:  []string{"text/plain", paint.MIMEType},
		DefaultOutputModes: []string{paint.MIMEType},
		SecuritySchemes: a2a.NamedSecuritySchemes{
			SchemeName: a2a.OAuth2SecurityScheme{
				Description: "Sign in with your Halide Supply membership.",
				Flows: a2a.DeviceCodeOAuthFlow{
					DeviceAuthorizationURL: c.cfg.SignIn.DeviceAuthorizationURL(),
					TokenURL:               c.cfg.SignIn.TokenURL(),
					RefreshURL:             c.cfg.SignIn.TokenURL(),
					Scopes:                 map[string]string{signin.StockScope: signin.StockScopeWords},
				},
				Oauth2MetadataURL: c.cfg.SignIn.MetadataURL(),
			},
		},
		SecurityRequirements: a2a.SecurityRequirementsOptions{
			{SchemeName: a2a.SecuritySchemeScopes{signin.StockScope}},
		},
		Skills: skills,
	}
}

func publicSkills() []a2a.AgentSkill {
	return []a2a.AgentSkill{
		{
			ID:          "browse-cameras",
			Name:        "Browse cameras",
			Description: "Lists the cameras Halide Supply holds for its members, each with its price and customer rating, opens any one in full, and sorts the list by price or by rating.",
			Tags:        []string{"cameras", "shopping", "prices", "shop-c"},
			Examples: []string{
				"What cameras do you have?",
				"Show me Halide Supply's stock",
				"Which camera is rated best at Halide Supply?",
			},
		},
		{
			ID:          "store-policy",
			Name:        "Shipping and returns",
			Description: "Answers questions about how Halide Supply ships members' orders, collecting from its warehouse, and returning unused stock within thirty days.",
			Tags:        []string{"shipping", "returns", "shop-c"},
			Examples: []string{
				"How fast do you ship?",
				"What is your returns policy?",
				"Can I collect from the warehouse?",
			},
		},
	}
}

var tradeSkill = a2a.AgentSkill{
	ID:          "trade-prices",
	Name:        "Trade prices",
	Description: "Lists the trade price this trade account pays for each camera, beside the ordinary price.",
	Tags:        []string{"trade", "prices", "shop-c"},
	Examples: []string{
		"What are my trade prices?",
		"Show me trade prices for your cameras",
	},
}

// GRPCAddress is the host of a base URL with the gRPC port.
func GRPCAddress(baseURL string, grpcPort int) (string, error) {
	u, err := url.Parse(baseURL)
	if err != nil || u.Hostname() == "" {
		return "", fmt.Errorf("the base URL %q names no host", baseURL)
	}
	return fmt.Sprintf("%s:%d", u.Hostname(), grpcPort), nil
}
