// Package stock reads Halide Supply's stock from the mock stores' shared dataset,
// mocks/dataset/products.json: the cameras every store shares, and this store's own listing,
// prices, trade prices and policy under its id.
package stock

import (
	"cmp"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"slices"
)

// StoreID is the store's key in the dataset.
const StoreID = "shop-c"

// Camera is one listed camera as a surface binds it.
type Camera struct {
	ID     string  `json:"id"`
	Name   string  `json:"name"`
	Price  float64 `json:"price"`
	Rating float64 `json:"rating"`
	// TradePrice is set only on a listing painted for a trade account.
	TradePrice float64 `json:"tradePrice,omitempty"`
}

// Detail is one camera opened in full.
type Detail struct {
	Camera
	Blurb string `json:"blurb"`
}

// Stock is the store's listing in its own order, with the shared blurbs and its policy.
type Stock struct {
	listing []listed
	blurbs  map[string]string
	policy  string
}

type listed struct {
	Camera
	trade float64
}

// SortKeys are the keys a listing can be sorted by.
var SortKeys = []string{"price", "rating"}

// DefaultPath is the dataset beside the store, found from this file's place in the checkout.
func DefaultPath() string {
	_, file, _, _ := runtime.Caller(0)
	// mocks/shop-c/agent/internal/stock/stock.go -> mocks/dataset/products.json
	return filepath.Join(filepath.Dir(file), "..", "..", "..", "..", "dataset", "products.json")
}

// Load reads the dataset at path.
func Load(path string) (*Stock, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("reading the dataset: %w", err)
	}
	var file struct {
		Products []struct {
			ID    string `json:"id"`
			Name  string `json:"name"`
			Blurb string `json:"blurb"`
		} `json:"products"`
		Stores map[string]struct {
			Policy  string `json:"policy"`
			Listing []struct {
				ID         string  `json:"id"`
				Price      float64 `json:"price"`
				Rating     float64 `json:"rating"`
				TradePrice float64 `json:"tradePrice"`
			} `json:"listing"`
		} `json:"stores"`
	}
	if err := json.Unmarshal(raw, &file); err != nil {
		return nil, fmt.Errorf("reading the dataset: %w", err)
	}
	store, ok := file.Stores[StoreID]
	if !ok {
		return nil, fmt.Errorf("the dataset has no %q store", StoreID)
	}
	names := map[string]string{}
	s := &Stock{blurbs: map[string]string{}, policy: store.Policy}
	for _, p := range file.Products {
		names[p.ID] = p.Name
		s.blurbs[p.ID] = p.Blurb
	}
	for _, entry := range store.Listing {
		name, ok := names[entry.ID]
		if !ok {
			return nil, fmt.Errorf("the %q listing names %q, which no product defines", StoreID, entry.ID)
		}
		if entry.TradePrice <= 0 {
			return nil, fmt.Errorf("the %q listing gives %q no trade price", StoreID, entry.ID)
		}
		s.listing = append(s.listing, listed{
			Camera: Camera{ID: entry.ID, Name: name, Price: entry.Price, Rating: entry.Rating},
			trade:  entry.TradePrice,
		})
	}
	return s, nil
}

// Listing is the store's cameras in its own order, with trade prices when trade is set.
func (s *Stock) Listing(trade bool) []Camera {
	items := make([]Camera, 0, len(s.listing))
	for _, entry := range s.listing {
		item := entry.Camera
		if trade {
			item.TradePrice = entry.trade
		}
		items = append(items, item)
	}
	return items
}

// Sorted is the listing ordered by key: price ascending, rating descending, each the way a
// shopper means it. A trade listing sorts by price on its trade price.
func (s *Stock) Sorted(key string, trade bool) ([]Camera, error) {
	items := s.Listing(trade)
	switch key {
	case "price":
		slices.SortStableFunc(items, func(a, b Camera) int {
			if trade {
				return cmp.Compare(a.TradePrice, b.TradePrice)
			}
			return cmp.Compare(a.Price, b.Price)
		})
	case "rating":
		slices.SortStableFunc(items, func(a, b Camera) int { return cmp.Compare(b.Rating, a.Rating) })
	default:
		return nil, fmt.Errorf("cannot sort by %q", key)
	}
	return items, nil
}

// Open is one listed camera in full, with trade prices when trade is set; false when the store
// does not list it.
func (s *Stock) Open(id string, trade bool) (Detail, bool) {
	for _, item := range s.Listing(trade) {
		if item.ID == id {
			return Detail{Camera: item, Blurb: s.blurbs[id]}, true
		}
	}
	return Detail{}, false
}

// Policy is the store's shipping and returns text.
func (s *Stock) Policy() string { return s.policy }
