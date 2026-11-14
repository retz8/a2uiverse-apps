// Package paint writes Halide Supply's A2UI v0.9.1 messages and reads the press a client sends
// back, as upstream's A2UI extension specification for A2A has them: an answer is one data part
// whose data is the list of its messages, marked application/a2ui+json in metadata.mimeType; a
// press is read by its content, from one message or from a list. No A2UI library is used.
package paint

import (
	"encoding/json"

	"github.com/a2aproject/a2a-go/v2/a2a"

	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/stock"
)

// Version is the A2UI version every message is stamped with.
const Version = "v0.9.1"

// MIMEType marks a data part as A2UI.
const MIMEType = "application/a2ui+json"

// BasicCatalogID is the standard basic catalog, the one catalog Shop C paints in. Its id is the
// same at A2UI v0.9 and v0.9.1.
const BasicCatalogID = "https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json"

// The surfaces Shop C paints, and the paths their data sits at: the listing at /items on list,
// a camera opened at /detail on the same surface, the policy at /policy on policy.
const (
	ListSurface   = "list"
	PolicySurface = "policy"
)

// Brand is the store's name inside its own surfaces.
const Brand = "Halide Supply"

// The presses Shop C's surfaces carry.
const (
	OpenCamera = "open-camera"
	BackToList = "back-to-list"
	SortBy     = "sort-by"
)

// TradeNote is the line under the listing when a member without a trade account asks for trade
// prices.
const TradeNote = "Trade prices are shown to trade accounts."

// Message is one A2UI message.
type Message = map[string]any

// Part is the data part that carries an answer's messages. Its data is plain JSON, as a
// protobuf value on gRPC takes it.
func Part(messages []Message) *a2a.Part {
	raw, err := json.Marshal(messages)
	if err != nil {
		panic(err) // the messages are maps, lists, strings and numbers
	}
	var data []any
	if err := json.Unmarshal(raw, &data); err != nil {
		panic(err)
	}
	part := a2a.NewDataPart(data)
	part.Metadata = map[string]any{"mimeType": MIMEType}
	return part
}

func message(kind string, body map[string]any) Message {
	return Message{"version": Version, kind: body}
}

func createSurface(surfaceID string) Message {
	return message("createSurface", map[string]any{"surfaceId": surfaceID, "catalogId": BasicCatalogID})
}

func updateDataModel(surfaceID, path string, value any) Message {
	return message("updateDataModel", map[string]any{"surfaceId": surfaceID, "path": path, "value": value})
}

func updateComponents(surfaceID string, components []map[string]any) Message {
	return message("updateComponents", map[string]any{"surfaceId": surfaceID, "components": components})
}

// view names which prices a surface shows, carried on each press so an answer to it is painted
// the same way. Who may see trade prices is judged by the member, never by the press.
func view(trade bool) string {
	if trade {
		return "trade"
	}
	return "member"
}

func text(id string, value any, variant string) map[string]any {
	c := map[string]any{"id": id, "component": "Text", "text": value}
	if variant != "" {
		c["variant"] = variant
	}
	return c
}

func button(id, child, variant, event string, context map[string]any) map[string]any {
	return map[string]any{
		"id": id, "component": "Button", "variant": variant, "child": child,
		"action": map[string]any{"event": map[string]any{"name": event, "context": context}},
	}
}

func path(p string) map[string]any { return map[string]any{"path": p} }

// listTree is the listing: a title, sort controls, a header row and one row per camera, each
// row opening its camera.
func listTree(trade bool, note string) []map[string]any {
	title := Brand
	if trade {
		title = Brand + " trade prices"
	}
	body := []any{"title"}
	if note != "" {
		body = append(body, "note")
	}
	body = append(body, "controls", "header", "rows")
	header := []any{"header-name", "header-price"}
	cells := []any{"row-name", "row-price"}
	if trade {
		header = append(header, "header-trade")
		cells = append(cells, "row-trade")
	}
	header = append(header, "header-rating")
	cells = append(cells, "row-rating")
	tree := []map[string]any{
		{"id": "root", "component": "Card", "child": "body"},
		{"id": "body", "component": "Column", "children": body},
		text("title", title, "h3"),
	}
	if note != "" {
		tree = append(tree, text("note", note, "caption"))
	}
	tree = append(tree,
		map[string]any{"id": "controls", "component": "Row", "children": []any{"sort-price", "sort-rating"}},
		button("sort-price", "sort-price-label", "borderless", SortBy, map[string]any{"key": "price", "view": view(trade)}),
		text("sort-price-label", "Sort by price", ""),
		button("sort-rating", "sort-rating-label", "borderless", SortBy, map[string]any{"key": "rating", "view": view(trade)}),
		text("sort-rating-label", "Sort by rating", ""),
		map[string]any{"id": "header", "component": "Row", "children": header},
		text("header-name", "Camera", "caption"),
		text("header-price", "Price", "caption"),
	)
	if trade {
		tree = append(tree, text("header-trade", "Trade price", "caption"))
	}
	tree = append(tree,
		text("header-rating", "Rating", "caption"),
		map[string]any{"id": "rows", "component": "List", "children": map[string]any{"componentId": "row", "path": "/items"}},
		button("row", "row-body", "borderless", OpenCamera, map[string]any{"cameraId": path("id"), "view": view(trade)}),
		map[string]any{"id": "row-body", "component": "Row", "children": cells},
		text("row-name", path("name"), ""),
		text("row-price", path("price"), ""),
	)
	if trade {
		tree = append(tree, text("row-trade", path("tradePrice"), ""))
	}
	return append(tree, text("row-rating", path("rating"), "caption"))
}

// detailTree is one camera opened, on the listing's own surface, with the way back to the list.
func detailTree(trade bool) []map[string]any {
	figures := []any{"detail-price"}
	if trade {
		figures = append(figures, "detail-trade")
	}
	figures = append(figures, "detail-rating")
	tree := []map[string]any{
		{"id": "root", "component": "Card", "child": "body"},
		{"id": "body", "component": "Column", "children": []any{"detail-name", "detail-blurb", "detail-figures", "back"}},
		text("detail-name", path("/detail/name"), "h3"),
		text("detail-blurb", path("/detail/blurb"), ""),
		{"id": "detail-figures", "component": "Row", "children": figures},
		text("detail-price", path("/detail/price"), ""),
	}
	if trade {
		tree = append(tree, text("detail-trade", path("/detail/tradePrice"), ""))
	}
	return append(tree,
		text("detail-rating", path("/detail/rating"), "caption"),
		button("back", "back-label", "primary", BackToList, map[string]any{"view": view(trade)}),
		text("back-label", "Back to the list", ""),
	)
}

// Listing paints the listing on a new list surface, trade prices beside the ordinary ones when
// trade is set, under note when one is given.
func Listing(items []stock.Camera, trade bool, note string) []Message {
	return []Message{
		createSurface(ListSurface),
		updateDataModel(ListSurface, "/", map[string]any{"items": items}),
		updateComponents(ListSurface, listTree(trade, note)),
	}
}

// Policy paints the store's shipping and returns on a policy surface.
func Policy(policy string) []Message {
	return []Message{
		createSurface(PolicySurface),
		updateDataModel(PolicySurface, "/", map[string]any{"policy": policy}),
		updateComponents(PolicySurface, []map[string]any{
			{"id": "root", "component": "Card", "child": "body"},
			{"id": "body", "component": "Column", "children": []any{"policy-title", "policy-text"}},
			text("policy-title", "Shipping and returns", "h3"),
			text("policy-text", path("/policy"), ""),
		}),
	}
}

// Opened shows one camera in full on the surface the press came from.
func Opened(surfaceID string, camera stock.Detail, trade bool) []Message {
	return []Message{
		updateDataModel(surfaceID, "/", map[string]any{"detail": camera}),
		updateComponents(surfaceID, detailTree(trade)),
	}
}

// Back puts the listing back on the surface the press came from.
func Back(surfaceID string, items []stock.Camera, trade bool) []Message {
	return []Message{
		updateDataModel(surfaceID, "/", map[string]any{"items": items}),
		updateComponents(surfaceID, listTree(trade, "")),
	}
}

// Reordered writes the same cameras back to /items in a new order; the tree stays.
func Reordered(surfaceID string, items []stock.Camera) []Message {
	return []Message{updateDataModel(surfaceID, "/items", items)}
}

// Said replaces a surface with one line, for a press Shop C cannot answer.
func Said(surfaceID, words string) []Message {
	return []Message{updateComponents(surfaceID, []map[string]any{text("root", words, "")})}
}

// Press is the action a client sent back.
type Press struct {
	Name      string
	SurfaceID string
	Context   map[string]any
}

// ReadPress finds the first action among a message's parts, read by content: a data part whose
// data is one A2UI message holding an action, or a list of messages one of which does. No mark is
// read. False when the message carries no action.
func ReadPress(parts []*a2a.Part) (Press, bool) {
	for _, part := range parts {
		data, ok := part.Content.(a2a.Data)
		if !ok {
			continue
		}
		candidates := []any{data.Value}
		if list, ok := data.Value.([]any); ok {
			candidates = list
		}
		for _, candidate := range candidates {
			msg, ok := candidate.(map[string]any)
			if !ok {
				continue
			}
			action, ok := msg["action"].(map[string]any)
			if !ok {
				continue
			}
			press := Press{Context: map[string]any{}}
			press.Name, _ = action["name"].(string)
			press.SurfaceID, _ = action["surfaceId"].(string)
			if ctx, ok := action["context"].(map[string]any); ok {
				press.Context = ctx
			}
			return press, true
		}
	}
	return Press{}, false
}

// Text is the words of a message's text parts, joined by a space.
func Text(parts []*a2a.Part) string {
	words := ""
	for _, part := range parts {
		if t, ok := part.Content.(a2a.Text); ok {
			if words != "" {
				words += " "
			}
			words += string(t)
		}
	}
	return words
}

// Unhandled is the line for a press Shop C does not know, or a camera it does not list.
const Unhandled = "That isn't something Halide Supply can do here."
