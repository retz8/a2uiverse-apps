package signin

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io/fs"
	"os"
	"path/filepath"
	"time"
)

// stateFile holds what a restart keeps: the registered clients and the tokens, each token by its
// hash alone.
const stateFile = "signin.json"

type client struct {
	Name     string    `json:"name"`
	Grants   []string  `json:"grants"`
	Redirect []string  `json:"redirectUris,omitempty"`
	Issued   time.Time `json:"issued"`
}

type grant struct {
	ClientID string    `json:"clientId"`
	Subject  string    `json:"subject"`
	Scope    string    `json:"scope"`
	Expires  time.Time `json:"expires"`
	// Refresh is the hash of the refresh token an access token was issued under, so revoking the
	// refresh token revokes it too.
	Refresh string `json:"refresh,omitempty"`
}

type state struct {
	Clients map[string]client `json:"clients"`
	Access  map[string]grant  `json:"access"`
	Refresh map[string]grant  `json:"refresh"`
}

func newState() state {
	return state{Clients: map[string]client{}, Access: map[string]grant{}, Refresh: map[string]grant{}}
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}

func loadState(dir string) (state, error) {
	raw, err := os.ReadFile(filepath.Join(dir, stateFile))
	if errors.Is(err, fs.ErrNotExist) {
		return newState(), nil
	}
	if err != nil {
		return state{}, err
	}
	s := newState()
	if err := json.Unmarshal(raw, &s); err != nil {
		return state{}, err
	}
	return s, nil
}

// save writes the state whole, owner-only, through a file renamed into place.
func (s state) save(dir string, now time.Time) error {
	for hash, g := range s.Access {
		if now.After(g.Expires) {
			delete(s.Access, hash)
		}
	}
	for hash, g := range s.Refresh {
		if now.After(g.Expires) {
			delete(s.Refresh, hash)
		}
	}
	raw, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return err
	}
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return err
	}
	tmp, err := os.CreateTemp(dir, stateFile+".*")
	if err != nil {
		return err
	}
	defer os.Remove(tmp.Name())
	if err := tmp.Chmod(0o600); err != nil {
		tmp.Close()
		return err
	}
	if _, err := tmp.Write(raw); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	return os.Rename(tmp.Name(), filepath.Join(dir, stateFile))
}
