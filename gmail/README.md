# Gmail

An A2A agent that answers questions about your mail with UI it generates in A2UI.

- **MCP server**: [Gmail's MCP server](https://developers.google.com/workspace/gmail/api/guides/configure-mcp-server), run by Google. Your mailbox lives behind it; the server isn't part of this repo.
- **Agent** ([`agent/`](agent/)): the agentic BFF. It takes a question, calls the MCP server, and answers with UI instead of data. It reads mail, saves drafts and applies labels.
- **Catalog** ([`gmail-catalog/`](gmail-catalog/)): the A2UI components that UI is built from, styled as Gmail. A2UI is a protocol for agents to generate UI.

## Quick start

```bash
cd agent
uv sync
uv run python -m app --mode deterministic   # canned answers, no key needed
```

Live mode needs a Gemini key and a Google login shared with Calendar — see the [agent README](agent/README.md).

## Connecting to A2UIVerse

[`manifest.json`](manifest.json) is the app's [A2UIVerse](https://github.com/retz8/a2uiverse) manifest: its id, agent URL and catalog. It's a placeholder until A2UIVerse's bundle format lands. How the agent and the catalog connect is in their own READMEs: the [agent](agent/README.md#connecting-to-a2uiverse) and the [catalog](gmail-catalog/README.md#connecting-to-a2uiverse).
