package keys

import (
	"os"
	"path/filepath"
	"testing"
)

// A key is made once and read back after a restart under the same id, in a file only its owner
// can read.
func TestAKeyOutlivesARestart(t *testing.T) {
	dir := t.TempDir()
	made, err := LoadOrCreate(dir, "card-key.pem")
	if err != nil {
		t.Fatal(err)
	}
	read, err := LoadOrCreate(dir, "card-key.pem")
	if err != nil {
		t.Fatal(err)
	}
	if read.ID != made.ID || !read.Private.Equal(made.Private) {
		t.Fatal("the key read back is another key")
	}
	info, err := os.Stat(filepath.Join(dir, "card-key.pem"))
	if err != nil {
		t.Fatal(err)
	}
	if mode := info.Mode().Perm(); mode != 0o600 {
		t.Fatalf("the key file is %o", mode)
	}
	other, _ := LoadOrCreate(dir, "id-token-key.pem")
	if other.ID == made.ID {
		t.Fatal("two keys share an id")
	}
	set := Set(made, other)["keys"].([]map[string]string)
	if len(set) != 2 || set[0]["kid"] != made.ID || set[0]["crv"] != "P-256" || set[0]["x"] == "" {
		t.Fatalf("the key set is %v", set)
	}
}
