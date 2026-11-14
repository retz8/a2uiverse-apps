# Shop C

An A2A agent for Halide Supply, an invented members' warehouse for working photographers, written by hand in Go with no A2UI library.

Halide Supply is a mock store beside [Shop A](../shop-a/) and [Shop B](../shop-b/), with no real backend. A member signs in to see its cameras, and a trade account sees trade prices beside the ordinary ones.

1. Its stock is [`mocks/dataset/products.json`](../dataset/products.json), which the other two stores read too: the same five cameras, with Halide Supply's own prices, ratings and trade prices.
2. The [agent](agent/) is built on the Go A2A SDK, [`a2a-go`](https://github.com/a2aproject/a2a-go), rather than on the kit. It answers A2A 1.0 on gRPC, HTTP+JSON and JSON-RPC, signs members in by device code on its own sign-in page, serves each signed-in member a card of their own, and signs its cards.
3. It has no catalog package. It paints in A2UI's basic catalog, which A2UIVerse holds for every app, so nothing is packed and nothing written for A2UIVerse alone is sent.

## Quick start

```bash
cd agent
go run .                     # port 12003, gRPC on 12103; Go 1.26 or newer
go run . token --member mara # in another terminal: a token for the trade member
```

## Connecting to A2UIVerse

Shop C is not in A2UIVerse's launcher. Start it by hand beside the other two, then install it from its card URL or publish it with Stellify, as the [agent's README](agent/README.md#connecting-to-a2uiverse) says.
