// Command agent runs Shop C, Halide Supply's A2A agent: gRPC on one port, and on the other the
// agent card, the key set, the store's sign-in and its JSON-RPC and HTTP+JSON endpoints.
//
//	go run .                      serve on ports 12003 and 12103
//	go run . token --member mara  print an access token for a member, from the running store
package main

import (
	"flag"
	"fmt"
	"log"
	"net"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/agent"
	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/cards"
	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/keys"
	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/signin"
	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/stock"
)

const (
	defaultPort     = 12003
	defaultGRPCPort = 12103
)

func main() {
	if len(os.Args) > 1 && os.Args[1] == "token" {
		if err := tokenCommand(os.Args[2:]); err != nil {
			fmt.Fprintln(os.Stderr, "token:", err)
			os.Exit(1)
		}
		return
	}
	flags := flag.NewFlagSet("agent", flag.ExitOnError)
	host := flags.String("host", "localhost", "the host both ports listen on")
	port := flags.Int("port", defaultPort, "the HTTP port: the card, sign-in, JSON-RPC and HTTP+JSON")
	grpcPort := flags.Int("grpc-port", defaultGRPCPort, "the gRPC port")
	baseURL := flags.String("base-url", "", "the address the card advertises; defaults to http://<host>:<port>")
	publicURL := flags.String("public-url", "", "the address a browser reaches the sign-in page at; defaults to --base-url")
	stateDir := flags.String("state-dir", "", "where the keys, the registered clients and the tokens are kept; defaults to the agent's .state")
	_ = flags.Parse(os.Args[1:])
	if err := serve(*host, *port, *grpcPort, *baseURL, *publicURL, *stateDir); err != nil {
		log.Fatal(err)
	}
}

func serve(host string, port, grpcPort int, baseURL, publicURL, stateDir string) error {
	if baseURL == "" {
		baseURL = fmt.Sprintf("http://%s:%d", host, port)
	}
	baseURL = strings.TrimRight(baseURL, "/")
	if publicURL == "" {
		publicURL = baseURL
	}
	publicURL = strings.TrimRight(publicURL, "/")
	if stateDir == "" {
		stateDir = defaultStateDir()
	}
	store, err := build(baseURL, publicURL, stateDir, grpcPort)
	if err != nil {
		return err
	}
	httpListener, err := net.Listen("tcp", net.JoinHostPort(host, fmt.Sprint(port)))
	if err != nil {
		return err
	}
	grpcListener, err := net.Listen("tcp", net.JoinHostPort(host, fmt.Sprint(grpcPort)))
	if err != nil {
		return err
	}
	handler := store.Handler()
	log.Printf("Shop C at %s, gRPC on %s:%d; card %s/.well-known/agent-card.json; sign-in page %s%s",
		baseURL, host, grpcPort, baseURL, publicURL, signin.PagePath)
	return agent.Serve(httpListener, grpcListener, store.HTTP(handler), store.GRPC(handler))
}

// build reads the dataset and the state directory and makes the store.
func build(baseURL, publicURL, stateDir string, grpcPort int) (*agent.Store, error) {
	s, err := stock.Load(stock.DefaultPath())
	if err != nil {
		return nil, err
	}
	cardKey, err := keys.LoadOrCreate(stateDir, "card-key.pem")
	if err != nil {
		return nil, fmt.Errorf("the card's key: %w", err)
	}
	idKey, err := keys.LoadOrCreate(stateDir, "id-token-key.pem")
	if err != nil {
		return nil, fmt.Errorf("the ID-token key: %w", err)
	}
	signIn, err := signin.New(signin.Config{
		Issuer:    baseURL,
		PublicURL: publicURL,
		JWKSURL:   baseURL + cards.KeySetPath,
		StateDir:  stateDir,
		IDKey:     idKey,
	})
	if err != nil {
		return nil, err
	}
	grpcAddress, err := cards.GRPCAddress(baseURL, grpcPort)
	if err != nil {
		return nil, err
	}
	c, err := cards.New(cards.Config{BaseURL: baseURL, GRPCAddress: grpcAddress, SignIn: signIn, Key: cardKey})
	if err != nil {
		return nil, err
	}
	return &agent.Store{Stock: s, SignIn: signIn, Cards: c, KeySet: []keys.Key{cardKey, idKey}}, nil
}

// defaultStateDir is the agent folder's .state, found from this file's place in the checkout.
func defaultStateDir() string {
	_, file, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(file), ".state")
}
