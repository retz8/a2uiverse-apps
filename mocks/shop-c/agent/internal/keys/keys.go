// Package keys keeps the store's P-256 keys in its state directory, made at first run and read
// back after a restart, and writes their public halves as a JSON Web Key Set.
package keys

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
)

// Key is one signing key and the id it is published under.
type Key struct {
	Private *ecdsa.PrivateKey
	ID      string
}

// LoadOrCreate reads the key in file under dir, or makes one and writes it there readable by the
// owner alone. Its id is drawn from the public key, so a key read back keeps its id.
func LoadOrCreate(dir, file string) (Key, error) {
	path := filepath.Join(dir, file)
	raw, err := os.ReadFile(path)
	switch {
	case err == nil:
		block, _ := pem.Decode(raw)
		if block == nil {
			return Key{}, fmt.Errorf("%s holds no PEM key", path)
		}
		private, err := x509.ParseECPrivateKey(block.Bytes)
		if err != nil {
			return Key{}, fmt.Errorf("reading %s: %w", path, err)
		}
		return withID(private), nil
	case errors.Is(err, fs.ErrNotExist):
		private, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
		if err != nil {
			return Key{}, err
		}
		der, err := x509.MarshalECPrivateKey(private)
		if err != nil {
			return Key{}, err
		}
		if err := os.MkdirAll(dir, 0o700); err != nil {
			return Key{}, err
		}
		encoded := pem.EncodeToMemory(&pem.Block{Type: "EC PRIVATE KEY", Bytes: der})
		if err := os.WriteFile(path, encoded, 0o600); err != nil {
			return Key{}, err
		}
		return withID(private), nil
	default:
		return Key{}, err
	}
}

func withID(private *ecdsa.PrivateKey) Key {
	der, _ := x509.MarshalPKIXPublicKey(&private.PublicKey)
	sum := sha256.Sum256(der)
	return Key{Private: private, ID: base64.RawURLEncoding.EncodeToString(sum[:])[:16]}
}

// JWK is the key's public half as a JSON Web Key for ES256.
func (k Key) JWK() map[string]string {
	size := (k.Private.Curve.Params().BitSize + 7) / 8
	x := make([]byte, size)
	y := make([]byte, size)
	pub, _ := k.Private.PublicKey.ECDH()
	point := pub.Bytes() // 0x04 || X || Y
	copy(x, point[1:1+size])
	copy(y, point[1+size:])
	return map[string]string{
		"kty": "EC",
		"crv": "P-256",
		"x":   base64.RawURLEncoding.EncodeToString(x),
		"y":   base64.RawURLEncoding.EncodeToString(y),
		"kid": k.ID,
		"alg": "ES256",
		"use": "sig",
	}
}

// Set is the JSON Web Key Set of the keys given.
func Set(keys ...Key) map[string]any {
	list := make([]map[string]string, len(keys))
	for i, k := range keys {
		list[i] = k.JWK()
	}
	return map[string]any{"keys": list}
}
