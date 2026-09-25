# Shop B

An A2A agent that answers questions about Northlight's cameras with UI it generates in A2UI.

Northlight is invented: a mock store, an online camera retailer, with no real backend.

- **Dataset**: [`mocks/dataset/products.json`](../dataset/products.json), in place of an MCP server. [Shop A](../shop-a/) reads the same file; the two stores list the same cameras, each with its own prices, ratings and stock.
- **Agent** ([`agent/`](agent/)): Agentic BFF that takes a question, reads the dataset, and answers with UI instead of data. It lists the cameras in stock, opens one, sorts them, and answers shipping and returns questions.
- **Catalog** ([`shop-b-catalog/`](shop-b-catalog/)): A2UI components that UI is built from, in a neutral theme with a teal accent. A2UI is a protocol for agents to generate UI.

## Quick start

```bash
cd agent
uv sync
uv run python -m app --mode deterministic   # answers built from the dataset, no key needed
```

The agent runs on port **12002**. The model modes need only a Gemini key. See the [agent README](agent/README.md).

## Connecting to A2UIVerse

Shop A and Shop B are a matched pair for testing [A2UIVerse](https://github.com/retz8/a2uiverse)'s merged view: two stores over the same cameras, so a merge across them is right by construction. They're left out of A2UIVerse's apps by default; to run the pair in place of the vendor apps, from the `a2uiverse` repo:

```bash
pnpm dev:all --agents-dir ../a2uiverse-apps/mocks
```

[`manifest.json`](manifest.json) is the app's A2UIVerse manifest: its id, agent URL and catalog. It's a placeholder until A2UIVerse's bundle format lands. How the agent and the catalog connect is in their own READMEs: the [agent](agent/README.md#connecting-to-a2uiverse) and the [catalog](shop-b-catalog/README.md#connecting-to-a2uiverse).
