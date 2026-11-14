# Shop C agent

An A2A agent for Halide Supply, an invented camera warehouse, written by hand in Go on [`a2a-go`](https://github.com/a2aproject/a2a-go) v2.8.0, with no model, no kit and no A2UI library. It runs on port **12003**, gRPC on **12103**.

There is no store behind it. Its stock is [`mocks/dataset/products.json`](../../dataset/products.json), which [Shop A](../../shop-a/) and [Shop B](../../shop-b/) read too.

## Quick start

Go 1.26 or newer.

```bash
go run .                       # serves the card, sign-in and A2A on 12003, gRPC on 12103
go run . token --member mara   # in another terminal: an access token for the trade member
```

## What it can do

1. It lists the cameras, each with its price and rating, opens one in full and goes back to the list, and sorts the list by price or by rating.
2. It answers questions about shipping, returns and collecting from the warehouse.
3. For a trade account it lists trade prices beside the ordinary ones. A member without one who asks for trade prices is shown the ordinary listing, under the line "Trade prices are shown to trade accounts."

Every answer is built by code from the dataset. Shop C has no run modes.

## Options

| Option         | Default                  | What it sets                                                               |
| -------------- | ------------------------ | -------------------------------------------------------------------------- |
| `--port`       | `12003`                  | the HTTP port: the card, the key set, sign-in, JSON-RPC and HTTP+JSON      |
| `--grpc-port`  | `12103`                  | the gRPC port                                                              |
| `--host`       | `localhost`              | the host both ports listen on                                              |
| `--base-url`   | `http://<host>:<port>`   | the address the card advertises                                            |
| `--public-url` | `--base-url`             | the address a browser reaches the sign-in page at, such as a tunnel's      |
| `--state-dir`  | `.state` beside `go.mod` | where the keys, the registered clients and the tokens are kept, owner-only |

The kit's agents take the same options, and two more, `--mode` and `--access-token-lifetime`.

## The members

Both members are made up.

| Member | Who                        | Account  |
| ------ | -------------------------- | -------- |
| `mara` | Mara Okafor, Okafor Studio | trade    |
| `theo` | Theo Lindqvist             | ordinary |

## Signing in

The card offers one sign-in, OAuth's device-code flow ([RFC 8628](https://www.rfc-editor.org/rfc/rfc8628)), and requires it: every A2A call needs an access token the store issued. A call without one is answered HTTP 401 with a `Bearer` challenge on JSON-RPC and HTTP+JSON, and `UNAUTHENTICATED` on gRPC.

The store is its own authorization server, in the same process and on the same origin:

1. Its metadata is at `/.well-known/oauth-authorization-server`.
2. A client registers itself by dynamic registration ([RFC 7591](https://www.rfc-editor.org/rfc/rfc7591)). The server offers no client ID metadata document.
3. A device code from `/oauth/device` lives 10 minutes and may be asked about at most every 5 seconds.
4. `/oauth/token` exchanges it for an access token and an ID token naming the member, each living an hour, and a refresh token living 30 days.
5. `/oauth/revoke` revokes a token ([RFC 7009](https://www.rfc-editor.org/rfc/rfc7009)). Revoking a refresh token revokes the access tokens issued under it.

The sign-in page is at `/device`. Opened with the code in its address it shows the code back to check; opened bare it asks for the code. It lists the members, says what signing in lets the app asking do, and offers Approve and Refuse. A `login_hint` naming a member fixes the page to that member.

The state directory keeps the card's key, the ID-token key, the registered clients and the tokens, each token by its hash. A restart leaves members signed in. Deleting the directory forgets every client and every sign-in.

## A member's token

`go run . token --member mara` signs the member in to the running store from start to finish, with no browser, and prints the access token. It registers a client, asks a code, approves it on the sign-in page as the member, and exchanges it. `--url` names a store elsewhere than `http://localhost:12003`. It approves without a person only because every member is made up.

## The cards

The public card lists three interfaces at A2A 1.0, in the order of `Order` in [`internal/cards/cards.go`](internal/cards/cards.go):

1. gRPC at `localhost:12103`.
2. HTTP+JSON at `/rest`.
3. JSON-RPC at `/jsonrpc`.

To run another order, edit that list. The card names upstream's A2UI extension at v0.9.1 with the basic catalog's id, says it streams, and says it serves an extended card.

A signed-in member is served a card of their own. It lists the same interfaces and the same sign-in, and differs only in its skills: the trade member's card adds "Trade prices".

Every card is signed by `a2a-go`'s signer under ES256, with a P-256 key the store makes at first run in its state directory. The key set is at `/.well-known/jwks.json`, beside the key the ID tokens are signed with.

## What it paints

Each answer is one message holding one data part. The part's `data` is the list of the answer's A2UI v0.9.1 messages, marked `application/a2ui+json` in `metadata.mimeType`, as upstream's [A2UI extension specification](https://github.com/a2ui-project/a2ui/blob/main/specification/v0_9_1/docs/a2ui_extension_specification.md) has it. A press is read by its content, from one message or from a list.

Two surfaces, in the basic catalog:

| Surface  | Data                                                                                     |
| -------- | ---------------------------------------------------------------------------------------- |
| `list`   | `/items`, an array of `{id, name, price, rating}`, with `tradePrice` for a trade listing |
| `policy` | `/policy`, text                                                                          |

Opening a camera replaces `list`'s data with a `/detail` object, and going back restores `/items`. Sorting writes the same cameras back to `/items` in a new order. Neither creates a surface.

## Connecting to A2UIVerse

Run the store with `--public-url` set to the address the browser reaches port 12003 at when the browser is on another machine, such as `https://<tunnel-id>-12003.asse.devtunnels.ms`. The card and every other address stay on `localhost`, where A2UIVerse reaches them.

A2UIVerse's launcher does not start Shop C. Install it from its card URL alone, from the [A2UIVerse](https://github.com/retz8/a2uiverse) repo:

```bash
pnpm --filter @a2uiverse/orchestrator registry install shop-c http://localhost:12003/.well-known/agent-card.json
```

Or publish it with [Stellify](https://github.com/retz8/a2uiverse/tree/main/packages/stellify). Every catalog package in this repo holds Stellify, so run it from Shop B's, with a publisher name claimed once (`pnpm exec stellify claim <name> --marketplace http://localhost:10002`). The preview is taken as the trade member:

```bash
cd ../../shop-b/shop-b-catalog
export STELLIFY_CREDENTIAL=$(cd ../../shop-c/agent && go run . token --member mara)
pnpm exec stellify preview shop-c http://localhost:12003/.well-known/agent-card.json --out ../../shop-c/preview.json
pnpm exec stellify publish shop-c http://localhost:12003/.well-known/agent-card.json --preview ../../shop-c/preview.json
```

Nothing is packed and no artifact folder is handed. When the card changes, move `Version` in `internal/cards/cards.go` to one the app has never published.

## Test

```bash
go test ./...
gofmt -l . && go vet ./...
```

The tests drive the store over real sockets on each binding with `a2a-go`'s own client, cover the authorization server, and check every A2UI message against the A2UI v0.9.1 schemas and the basic catalog, copied from upstream into `internal/paint/testdata`.

<details>
<summary><b>Layout</b></summary>

```
main.go, token.go     the launch options, the servers and the token command
internal/
  stock/              the dataset's listing, trade prices and policy
  paint/              the A2UI messages it writes and the press it reads
  members/            the two members
  signin/             the authorization server, the sign-in page, and the token command's sign-in
  cards/              the public card, each member's card, signing
  keys/               the keys in the state directory and the key set
  agent/              the three bindings, the credential check and the answers
```

</details>
