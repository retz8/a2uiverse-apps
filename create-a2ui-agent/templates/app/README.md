# __DISPLAY_NAME__

An A2A agent that answers questions about **TODO: what it covers, like "your mail"** with UI it generates in A2UI.

- **MCP server**: **TODO: __DISPLAY_NAME__'s MCP server, who runs it, and a link to its docs.** It isn't part of this repo.
- **Agent** ([`agent/`](agent/)): Agentic BFF that takes a question, calls the MCP server, and answers with UI instead of data. **TODO: what it reads and writes.**
- **Catalog** ([`__PACKAGE_NAME__/`](__PACKAGE_NAME__/)): A2UI components that UI is built from, in __DISPLAY_NAME__'s look. A2UI is a protocol for agents to generate UI.

## Quick start

```bash
cd agent
uv sync
uv run python -m app --mode deterministic   # canned answers, no key needed
```

The agent runs on port **__PORT__**. Live mode needs a Gemini key and the credential for __DISPLAY_NAME__'s MCP server — see the [agent README](agent/README.md).

## Connecting to A2UIVerse

[`manifest.json`](manifest.json) is the app's [A2UIVerse](https://github.com/retz8/a2uiverse) manifest: its id, agent URL and catalog. It's a placeholder until A2UIVerse's bundle format lands. How the agent and the catalog connect is in their own READMEs: the [agent](agent/README.md#connecting-to-a2uiverse) and the [catalog](__PACKAGE_NAME__/README.md#connecting-to-a2uiverse).
