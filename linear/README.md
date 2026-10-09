# Linear

An A2A agent that answers questions about your issues with UI it generates in A2UI.

- **MCP server**: [Linear's hosted MCP server](https://linear.app/docs/mcp), run by Linear. Your issues live behind it; the server isn't part of this repo.
- **Agent** ([`agent/`](agent/)): Agentic BFF that takes a question, calls the MCP server, and answers with UI instead of data. It reads issues, creates and updates them, and comments on them.
- **Catalog** ([`linear-catalog/`](linear-catalog/)): Linear's own set of A2UI components that UI is built from, in its look: panels, lists of issue rows grouped by state, properties, chips, and the status and priority glyphs. A2UI is a protocol for agents to generate UI.

## Quick start

```bash
cd agent
uv sync
uv run python -m app --mode deterministic   # canned answers, no key needed
```

The agent runs on port **11005**. Every mode has you sign in: `deterministic` and `stub` offer a made-up account, and `live` sends you to Linear, with nothing to set up there. Live mode also needs a Gemini key. See the [agent README](agent/README.md).

## Connecting to A2UIVerse

[A2UIVerse](https://github.com/retz8/a2uiverse) installs the app from its agent's card, with its catalog packed by Stellify. How the agent and the catalog connect is in their own READMEs: the [agent](agent/README.md#connecting-to-a2uiverse) and the [catalog](linear-catalog/README.md#connecting-to-a2uiverse).
