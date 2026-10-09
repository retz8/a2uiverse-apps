# GitHub

An A2A agent that answers questions about your repositories with UI it generates in A2UI.

- **MCP server**: [GitHub's MCP server](https://github.com/github/github-mcp-server), the remote one run by GitHub. Your repositories live behind it; the server isn't part of this repo.
- **Agent** ([`agent/`](agent/)): Agentic BFF that takes a question, calls the MCP server, and answers with UI instead of data. It reads repositories, issues, pull requests and notifications, and can comment, review, merge and edit files.
- **Catalog** ([`github-catalog/`](github-catalog/)): A2UI components that UI is built from, on Primer, GitHub's own design system. A2UI is a protocol for agents to generate UI.

## Quick start

```bash
cd agent
uv sync
uv run python -m app --mode deterministic   # canned answers, no key needed
```

The agent runs on port **11001**. Every mode has you sign in: `deterministic` and `stub` offer a made-up account, and `live` sends you to GitHub, through an OAuth App you register once, and acts as you. Live mode also needs a Gemini key. See the [agent README](agent/README.md).

## Connecting to A2UIVerse

[A2UIVerse](https://github.com/retz8/a2uiverse) installs the app from its agent's card, with its catalog packed by Stellify. How the agent and the catalog connect is in their own READMEs: the [agent](agent/README.md#connecting-to-a2uiverse) and the [catalog](github-catalog/README.md#connecting-to-a2uiverse).
