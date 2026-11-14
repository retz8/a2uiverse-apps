// Package members holds Halide Supply's two made-up members. Every member is invented, which is
// the one ground the store's token command approves a sign-in on without a person.
package members

import "strings"

// Member is one account of the store.
type Member struct {
	// Subject is the member's stable id, the ID token's sub.
	Subject string
	Name    string
	Email   string
	// Business is the trading name on a trade account.
	Business string
	Trade    bool
}

// All is every member, the trade member first.
var All = []Member{
	{
		Subject:  "halide-0417",
		Name:     "Mara Okafor",
		Email:    "mara@okafor-studio.example",
		Business: "Okafor Studio",
		Trade:    true,
	},
	{
		Subject: "halide-0582",
		Name:    "Theo Lindqvist",
		Email:   "theo.lindqvist@example.com",
	},
}

// Find is the member a name points at: their subject, their email, or their first name in any
// case. False when no member answers to it.
func Find(name string) (Member, bool) {
	for _, m := range All {
		first, _, _ := strings.Cut(m.Name, " ")
		if name == m.Subject || strings.EqualFold(name, m.Email) || strings.EqualFold(name, first) {
			return m, true
		}
	}
	return Member{}, false
}

// Account is the line a member is listed under on the sign-in page.
func (m Member) Account() string {
	if m.Trade {
		return m.Name + ", " + m.Business + " (trade account)"
	}
	return m.Name
}
