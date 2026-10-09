# Gmail

An A2A agent that answers questions about your mail with UI it generates in A2UI.

- **MCP server**: [Gmail's MCP server](https://developers.google.com/workspace/gmail/api/guides/configure-mcp-server), run by Google. Your mailbox lives behind it; the server isn't part of this repo.
- **Agent** ([`agent/`](agent/)): Agentic BFF that takes a question, calls the MCP server, and answers with UI instead of data. It reads mail, saves drafts and applies labels.
- **Catalog** ([`gmail-catalog/`](gmail-catalog/)): A2UI components that UI is built from, styled as Gmail. A2UI is a protocol for agents to generate UI.

## Quick start

```bash
cd agent
uv sync
uv run python -m app --mode deterministic   # canned answers, no key needed
```

The agent runs on port **11002**. Every mode has you sign in: `deterministic` and `stub` offer two made-up accounts, each with its own mail, and `live` sends you to Google, through an OAuth client in a Google Cloud project you set up once, shared with Calendar. Live mode also needs a Gemini key. See the [agent README](agent/README.md).

## Connecting to A2UIVerse

[A2UIVerse](https://github.com/retz8/a2uiverse) installs the app from its agent's card, with its catalog packed by Stellify. How the agent and the catalog connect is in their own READMEs: the [agent](agent/README.md#connecting-to-a2uiverse) and the [catalog](gmail-catalog/README.md#connecting-to-a2uiverse).
