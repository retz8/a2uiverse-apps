package main

import (
	"flag"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/members"
	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/signin"
)

// tokenCommand prints an access token for a member: it runs the store's device-code flow against
// the running store from start to finish and approves the code on the store's sign-in page as
// that member, with no browser. Every member is made up, which is the one ground it approves a
// sign-in without a person.
func tokenCommand(args []string) error {
	flags := flag.NewFlagSet("token", flag.ExitOnError)
	storeURL := flags.String("url", fmt.Sprintf("http://localhost:%d", defaultPort), "the running store's address")
	name := flags.String("member", "", "the member: mara (the trade account) or theo")
	_ = flags.Parse(args)
	m, ok := members.Find(*name)
	if !ok {
		return fmt.Errorf("no member %q: give mara or theo", *name)
	}
	base := strings.TrimRight(*storeURL, "/")
	token, err := signin.SignIn(http.DefaultClient, base, m, time.Sleep)
	if err != nil {
		return err
	}
	fmt.Println(token)
	return nil
}
