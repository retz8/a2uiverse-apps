package paint

import (
	"bytes"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/a2aproject/a2a-go/v2/a2a"
	"github.com/santhosh-tekuri/jsonschema/v6"

	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/stock"
)

// The A2UI v0.9.1 schemas and the v0.9.1 basic catalog in testdata/a2ui/v0_9_1 are copied
// unchanged from specification/v0_9_1 of a2ui-project/a2ui at commit
// 3ed9601862ecc78027e20ac80ad8b1b98a5d9079. Refresh them by copying again.
const schemaDir = "testdata/a2ui/v0_9_1"

// The schemas name each other under v0_9 ids. The message schema reaches the catalog as
// catalog.json beside itself, so the basic catalog is held under that address too.
const (
	listSchemaID    = "https://a2ui.org/specification/v0_9/server_to_client_list.json"
	catalogAlias    = "https://a2ui.org/specification/v0_9/catalog.json"
	clientSchemaID  = "https://a2ui.org/specification/v0_9/client_to_server.json"
	commonTypesID   = "https://a2ui.org/specification/v0_9/common_types.json"
	serverMessageID = "https://a2ui.org/specification/v0_9/server_to_client.json"
)

func schemas(t *testing.T) (list, client *jsonschema.Schema) {
	t.Helper()
	c := jsonschema.NewCompiler()
	add := func(file, id string, edit func(map[string]any)) {
		raw, err := os.ReadFile(filepath.Join(schemaDir, file))
		if err != nil {
			t.Fatal(err)
		}
		doc, err := jsonschema.UnmarshalJSON(bytes.NewReader(raw))
		if err != nil {
			t.Fatal(err)
		}
		if edit != nil {
			edit(doc.(map[string]any))
		}
		if err := c.AddResource(id, doc); err != nil {
			t.Fatal(err)
		}
	}
	add("server_to_client_list.json", listSchemaID, nil)
	add("server_to_client.json", serverMessageID, nil)
	add("client_to_server.json", clientSchemaID, nil)
	add("common_types.json", commonTypesID, nil)
	add("catalog.json", catalogAlias, func(doc map[string]any) { doc["$id"] = catalogAlias })
	var err error
	if list, err = c.Compile(listSchemaID); err != nil {
		t.Fatal(err)
	}
	if client, err = c.Compile(clientSchemaID); err != nil {
		t.Fatal(err)
	}
	return list, client
}

func asJSON(t *testing.T, v any) any {
	t.Helper()
	raw, err := json.Marshal(v)
	if err != nil {
		t.Fatal(err)
	}
	inst, err := jsonschema.UnmarshalJSON(bytes.NewReader(raw))
	if err != nil {
		t.Fatal(err)
	}
	return inst
}

func testStock(t *testing.T) *stock.Stock {
	t.Helper()
	s, err := stock.Load(stock.DefaultPath())
	if err != nil {
		t.Fatal(err)
	}
	return s
}

// Every list of messages Shop C writes validates as a server-to-client message list, each tree
// against the basic catalog.
func TestEveryAnswerValidates(t *testing.T) {
	list, _ := schemas(t)
	s := testStock(t)
	camera, _ := s.Open("lumen-x100", false)
	tradeCamera, _ := s.Open("lumen-x100", true)
	sorted, _ := s.Sorted("price", true)
	answers := map[string][]Message{
		"the listing":            Listing(s.Listing(false), false, ""),
		"trade prices":           Listing(s.Listing(true), true, ""),
		"the note on trade":      Listing(s.Listing(false), false, TradeNote),
		"the policy":             Policy(s.Policy()),
		"a camera opened":        Opened(ListSurface, camera, false),
		"a trade camera opened":  Opened(ListSurface, tradeCamera, true),
		"back to the list":       Back(ListSurface, s.Listing(true), true),
		"sorted":                 Reordered(ListSurface, sorted),
		"a press it cannot take": Said(ListSurface, Unhandled),
	}
	for name, messages := range answers {
		t.Run(name, func(t *testing.T) {
			part := Part(messages)
			if err := list.Validate(asJSON(t, part.Data())); err != nil {
				t.Fatalf("%v", err)
			}
			for _, m := range messages {
				if m["version"] != Version {
					t.Fatalf("a message is stamped %v, not %s", m["version"], Version)
				}
			}
		})
	}
}

// An answer's part holds the list of its messages as plain JSON, marked in metadata.mimeType
// and nowhere else.
func TestThePartIsMarkedAsUpstreamAsks(t *testing.T) {
	part := Part(Policy("Ships tomorrow."))
	if got := part.Meta()["mimeType"]; got != MIMEType {
		t.Fatalf("metadata.mimeType is %v", got)
	}
	if part.MediaType != "" {
		t.Fatalf("mediaType is %q; the mark rides metadata.mimeType alone", part.MediaType)
	}
	data, ok := part.Data().([]any)
	if !ok || len(data) != 3 {
		t.Fatalf("data is %T of %v, not a list of the three messages", part.Data(), part.Data())
	}
	if _, ok := data[0].(map[string]any); !ok {
		t.Fatalf("a message is %T, not a JSON object", data[0])
	}
}

func press(name string, context map[string]any) map[string]any {
	return map[string]any{
		"version": Version,
		"action": map[string]any{
			"name": name, "surfaceId": ListSurface, "sourceComponentId": "row",
			"timestamp": "2026-11-14T12:00:00Z", "context": context,
		},
	}
}

// A press is read by its content, from one message or from a list, marked or not; the presses
// Shop C's surfaces carry are valid client-to-server messages.
func TestAPressIsReadByContent(t *testing.T) {
	_, client := schemas(t)
	one := press(OpenCamera, map[string]any{"cameraId": "lumen-z6", "view": "trade"})
	if err := client.Validate(asJSON(t, one)); err != nil {
		t.Fatal(err)
	}
	marked := a2a.NewDataPart(one)
	marked.Metadata = map[string]any{"mimeType": MIMEType}
	forms := map[string]*a2a.Part{
		"one message, marked":    marked,
		"one message, unmarked":  a2a.NewDataPart(one),
		"a list of messages":     a2a.NewDataPart([]any{one}),
		"a list after an update": a2a.NewDataPart([]any{map[string]any{"version": Version}, one}),
	}
	for name, part := range forms {
		t.Run(name, func(t *testing.T) {
			got, ok := ReadPress([]*a2a.Part{a2a.NewTextPart("ignored"), part})
			if !ok || got.Name != OpenCamera || got.SurfaceID != ListSurface || got.Context["cameraId"] != "lumen-z6" {
				t.Fatalf("read %+v, %v", got, ok)
			}
		})
	}
	if _, ok := ReadPress([]*a2a.Part{a2a.NewTextPart("What cameras do you have?")}); ok {
		t.Fatal("a question read as a press")
	}
}

// The schemas as loaded refuse what the basic catalog does not hold, so a pass above means
// something.
func TestTheSchemasRefuseABrokenTree(t *testing.T) {
	list, _ := schemas(t)
	broken := map[string][]Message{
		"a component the catalog lacks": {updateComponents(ListSurface, []map[string]any{{"id": "root", "component": "Carousel"}})},
		"a Text with no text":           {updateComponents(ListSurface, []map[string]any{{"id": "root", "component": "Text"}})},
		"another version":               {{"version": "v0.8", "createSurface": map[string]any{"surfaceId": "x", "catalogId": BasicCatalogID}}},
	}
	for name, messages := range broken {
		t.Run(name, func(t *testing.T) {
			if err := list.Validate(asJSON(t, Part(messages).Data())); err == nil {
				t.Fatal("validated")
			}
		})
	}
}
