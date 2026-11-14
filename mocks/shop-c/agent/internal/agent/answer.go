package agent

import (
	"strings"

	"github.com/a2aproject/a2a-go/v2/a2a"

	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/members"
	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/paint"
	"github.com/retz8/a2uiverse-apps/mocks/shop-c/agent/internal/stock"
)

// Answer is what Shop C paints for a message from a member: the answer to a press when the
// message carries one, else the answer to its words. Every answer is built by code from the
// dataset.
func Answer(s *stock.Stock, m members.Member, parts []*a2a.Part) []paint.Message {
	if press, ok := paint.ReadPress(parts); ok {
		return answerPress(s, m, press)
	}
	return answerQuestion(s, m, paint.Text(parts))
}

var (
	policyWords = []string{"polic", "return", "ship", "delivery", "dispatch", "collect", "warehouse", "warrant"}
	tradeWords  = []string{"trade"}
)

func asks(text string, words []string) bool {
	lowered := strings.ToLower(text)
	for _, w := range words {
		if strings.Contains(lowered, w) {
			return true
		}
	}
	return false
}

// answerQuestion paints the policy for a question about shipping or returns, trade prices for a
// trade member asking for them, and the listing for anything else.
func answerQuestion(s *stock.Stock, m members.Member, text string) []paint.Message {
	switch {
	case asks(text, policyWords):
		return paint.Policy(s.Policy())
	case asks(text, tradeWords) && m.Trade:
		return paint.Listing(s.Listing(true), true, "")
	case asks(text, tradeWords):
		return paint.Listing(s.Listing(false), false, paint.TradeNote)
	default:
		return paint.Listing(s.Listing(false), false, "")
	}
}

// answerPress answers the three presses Shop C's listing carries. A press says which prices its
// surface shows; trade prices are shown only to a trade member, whatever the press says.
func answerPress(s *stock.Stock, m members.Member, press paint.Press) []paint.Message {
	surface := press.SurfaceID
	if surface == "" {
		surface = paint.ListSurface
	}
	trade := m.Trade && press.Context["view"] == "trade"
	switch press.Name {
	case paint.OpenCamera:
		id, _ := press.Context["cameraId"].(string)
		if camera, ok := s.Open(id, trade); ok {
			return paint.Opened(surface, camera, trade)
		}
	case paint.BackToList:
		return paint.Back(surface, s.Listing(trade), trade)
	case paint.SortBy:
		key, _ := press.Context["key"].(string)
		if items, err := s.Sorted(key, trade); err == nil {
			return paint.Reordered(surface, items)
		}
	}
	return paint.Said(surface, paint.Unhandled)
}
