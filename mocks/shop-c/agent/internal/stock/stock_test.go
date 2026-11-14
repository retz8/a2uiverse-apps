package stock

import (
	"slices"
	"testing"
)

func load(t *testing.T) *Stock {
	t.Helper()
	s, err := Load(DefaultPath())
	if err != nil {
		t.Fatal(err)
	}
	return s
}

func ids(items []Camera) []string {
	var out []string
	for _, c := range items {
		out = append(out, c.ID)
	}
	return out
}

// The store lists every camera of the dataset once, in an order that neither sort keeps, so a
// sort always moves something.
func TestTheListingIsTheStoresOwn(t *testing.T) {
	s := load(t)
	listing := s.Listing(false)
	if len(listing) != 5 {
		t.Fatalf("listed %d cameras", len(listing))
	}
	for _, key := range SortKeys {
		sorted, err := s.Sorted(key, false)
		if err != nil {
			t.Fatal(err)
		}
		if slices.Equal(ids(sorted), ids(listing)) {
			t.Fatalf("the listing is already sorted by %s", key)
		}
	}
	for _, c := range listing {
		if c.TradePrice != 0 {
			t.Fatal("an ordinary listing carries a trade price")
		}
	}
}

func TestTradePricesSitBesideTheOrdinaryOnes(t *testing.T) {
	s := load(t)
	for _, c := range s.Listing(true) {
		if c.TradePrice <= 0 || c.TradePrice >= c.Price {
			t.Fatalf("%s: trade %v against %v", c.ID, c.TradePrice, c.Price)
		}
	}
	sorted, _ := s.Sorted("price", true)
	for i := 1; i < len(sorted); i++ {
		if sorted[i-1].TradePrice > sorted[i].TradePrice {
			t.Fatal("a trade listing sorted by price is not in trade-price order")
		}
	}
	rated, _ := s.Sorted("rating", false)
	if rated[0].Rating < rated[len(rated)-1].Rating {
		t.Fatal("rating does not sort best first")
	}
	if _, err := s.Sorted("weight", false); err == nil {
		t.Fatal("sorted by a key the store does not know")
	}
}

func TestOpeningACamera(t *testing.T) {
	s := load(t)
	detail, ok := s.Open("kestrel-r5", true)
	if !ok || detail.Blurb == "" || detail.TradePrice == 0 {
		t.Fatalf("opened %+v, %v", detail, ok)
	}
	if _, ok := s.Open("no-such-camera", false); ok {
		t.Fatal("opened a camera the store does not list")
	}
}
