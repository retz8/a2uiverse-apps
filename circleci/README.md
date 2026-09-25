# CircleCI

An A2A agent that answers questions about your pipelines with UI it generates in A2UI.

- **MCP server**: [CircleCI's hosted MCP server](https://circleci.com/docs/guides/toolkit/circleci-mcp-overview/), run by CircleCI. Your pipelines live behind it; the server isn't part of this repo.
- **Agent** ([`agent/`](agent/)): Agentic BFF that takes a question, calls the MCP server, and answers with UI instead of data. It reads pipeline runs, workflows, jobs and logs, and reruns or cancels workflows.
- **Catalog** ([`circleci-catalog/`](circleci-catalog/)): A2UI components that UI is built from, styled as CircleCI, with a status pill of its own. A2UI is a protocol for agents to generate UI.

## Quick start

```bash
cd agent
uv sync
uv run python -m app --mode deterministic   # canned answers, no key needed
```

The agent runs on port **11004**. Live mode needs a Gemini key, a CircleCI token and the projects to read — see the [agent README](agent/README.md).

## Connecting to A2UIVerse

[`manifest.json`](manifest.json) is the app's [A2UIVerse](https://github.com/retz8/a2uiverse) manifest: its id, agent URL and catalog. It's a placeholder until A2UIVerse's bundle format lands. How the agent and the catalog connect is in their own READMEs: the [agent](agent/README.md#connecting-to-a2uiverse) and the [catalog](circleci-catalog/README.md#connecting-to-a2uiverse).
