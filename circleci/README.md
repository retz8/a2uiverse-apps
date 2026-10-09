# CircleCI

An A2A agent that answers questions about your pipelines with UI it generates in A2UI.

- **MCP server**: [CircleCI's hosted MCP server](https://circleci.com/docs/guides/toolkit/circleci-mcp-overview/), run by CircleCI. Your pipelines live behind it; the server isn't part of this repo.
- **Agent** ([`agent/`](agent/)): Agentic BFF that takes a question, calls the MCP server, and answers with UI instead of data. It reads pipeline runs, workflows, jobs and logs, and reruns or cancels workflows.
- **Catalog** ([`circleci-catalog/`](circleci-catalog/)): the A2UI components that UI is built from, CircleCI's own set in its look: panels, status pills, job lists, logs. A2UI is a protocol for agents to generate UI.

## Quick start

```bash
cd agent
uv sync
uv run python -m app --mode deterministic   # canned answers, no key needed
```

The agent runs on port **11004**. Every mode has you sign in: `deterministic` and `stub` offer a made-up account, and `live` sends you to CircleCI, with nothing to set up there, and reads the projects you follow. Live mode also needs a Gemini key. See the [agent README](agent/README.md).

## Connecting to A2UIVerse

[A2UIVerse](https://github.com/retz8/a2uiverse) installs the app from its agent's card, with its catalog packed by Stellify. How the agent and the catalog connect is in their own READMEs: the [agent](agent/README.md#connecting-to-a2uiverse) and the [catalog](circleci-catalog/README.md#connecting-to-a2uiverse).
