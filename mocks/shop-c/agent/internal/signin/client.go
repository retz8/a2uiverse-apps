package signin

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/members"
)

// SignIn signs a member in to the store at base, from start to finish and with no browser: it
// registers a client, asks a device code, approves it as the member on the store's own sign-in
// page and exchanges it, waiting between asks as the server says. It is the store's token command;
// every member is made up, which is the one ground it approves a sign-in without a person.
func SignIn(client *http.Client, base string, m members.Member, sleep func(time.Duration)) (string, error) {
	var metadata struct {
		RegistrationEndpoint        string `json:"registration_endpoint"`
		DeviceAuthorizationEndpoint string `json:"device_authorization_endpoint"`
		TokenEndpoint               string `json:"token_endpoint"`
	}
	if err := call(client, http.MethodGet, base+MetadataPath, "", nil, &metadata); err != nil {
		return "", fmt.Errorf("reading the sign-in metadata: %w", err)
	}
	var registered struct {
		ClientID string `json:"client_id"`
	}
	registration, _ := json.Marshal(map[string]any{
		"client_name":                "Shop C's token command",
		"grant_types":                []string{DeviceCodeGrant},
		"token_endpoint_auth_method": "none",
	})
	if err := call(client, http.MethodPost, metadata.RegistrationEndpoint, "application/json", strings.NewReader(string(registration)), &registered); err != nil {
		return "", fmt.Errorf("registering: %w", err)
	}
	var device struct {
		DeviceCode string `json:"device_code"`
		UserCode   string `json:"user_code"`
		Interval   int    `json:"interval"`
	}
	form := url.Values{"client_id": {registered.ClientID}, "scope": {"openid " + StockScope}, "login_hint": {m.Subject}}
	if err := call(client, http.MethodPost, metadata.DeviceAuthorizationEndpoint, "application/x-www-form-urlencoded", strings.NewReader(form.Encode()), &device); err != nil {
		return "", fmt.Errorf("asking a code: %w", err)
	}
	approval := url.Values{"code": {device.UserCode}, "member": {m.Subject}, "decision": {"approve"}}
	response, err := client.PostForm(base+PagePath, approval)
	if err != nil {
		return "", fmt.Errorf("approving the code: %w", err)
	}
	page, _ := io.ReadAll(response.Body)
	response.Body.Close()
	if response.StatusCode != http.StatusOK || !strings.Contains(string(page), "You're signed in") {
		return "", errors.New("the sign-in page did not take the approval")
	}
	interval := time.Duration(device.Interval) * time.Second
	exchange := url.Values{"grant_type": {DeviceCodeGrant}, "device_code": {device.DeviceCode}, "client_id": {registered.ClientID}}
	for {
		var tokens struct {
			AccessToken string `json:"access_token"`
			Error       string `json:"error"`
		}
		err := call(client, http.MethodPost, metadata.TokenEndpoint, "application/x-www-form-urlencoded", strings.NewReader(exchange.Encode()), &tokens)
		switch {
		case err == nil && tokens.AccessToken != "":
			return tokens.AccessToken, nil
		case tokens.Error == "authorization_pending":
			sleep(interval)
		case tokens.Error == "slow_down":
			interval += PollInterval
			sleep(interval)
		case err != nil:
			return "", fmt.Errorf("exchanging the code: %w", err)
		default:
			return "", errors.New("the token endpoint answered no token")
		}
	}
}

// call sends one request and reads its JSON answer into out, the body read on an error answer too.
func call(client *http.Client, method, target, contentType string, body io.Reader, out any) error {
	request, err := http.NewRequest(method, target, body)
	if err != nil {
		return err
	}
	if contentType != "" {
		request.Header.Set("Content-Type", contentType)
	}
	request.Header.Set("Accept", "application/json")
	response, err := client.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	raw, _ := io.ReadAll(response.Body)
	_ = json.Unmarshal(raw, out)
	if response.StatusCode >= 300 {
		return fmt.Errorf("%s %s answered HTTP %d: %s", method, target, response.StatusCode, strings.TrimSpace(string(raw)))
	}
	return nil
}
