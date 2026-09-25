# CircleCI agent

An A2A agent for CircleCI. It answers CI questions by painting A2UI surfaces with [`circleci-catalog`](../circleci-catalog/), the basic A2UI catalog in CircleCI's look. It runs on port **11004** and is built on [`a2ui-agent-kit`](../../agent-kit/).

## What it can do

In `live` mode it works through CircleCI's hosted MCP server.

- **Reads** a project's pipeline runs, each run's workflows, each workflow's jobs, and a job's log.
- **Reruns** a workflow — every job, or only the failed ones — and **cancels** a running one. Both are shown to you as a proposal first and run only when you confirm.
- **Can't** edit config, trigger a new pipeline, approve a hold, or delete anything.

9 of the server's tools are allowed, listed in `app/mcp.py`. To allow another, update that list, the pin in `tests/test_llm_mcp.py`, the stub in `app/tools.py`, and the domain doc in `app/knowledge/`, together.

## Run

```bash
uv sync
cp .env.example .env
uv run python -m app --mode deterministic
```

| Mode            | What runs                            | Needs                                                       |
| --------------- | ------------------------------------ | ----------------------------------------------------------- |
| `deterministic` | canned answers, no model             | nothing                                                     |
| `stub`          | the model over canned CI data        | `GOOGLE_API_KEY`                                            |
| `live`          | the model over CircleCI's hosted MCP | `GOOGLE_API_KEY`, `CIRCLECI_MCP_TOKEN`, `CIRCLECI_PROJECTS` |

`deterministic` answers any question with the recorded recent runs, and replays the recorded actions: opening a run, opening a job, proposing a rerun and confirming or declining it. Opening a run or a job paints a new surface, as the live agent does.

Other flags: `--port`, `--host`, and `--base-url`, the address the agent card advertises.

## CircleCI credentials (live mode)

1. **A personal API token.** In CircleCI: User settings → Personal API Tokens → Create New Token. Copy it (it's shown once) into `.env` as `CIRCLECI_MCP_TOKEN`.
2. **The projects.** The server can't list projects, so name them in `.env`: `CIRCLECI_PROJECTS=<repository>=<project-id>`, comma-separated. The id is the project's UUID from its CircleCI project settings.

The token has no scopes: **the agent can do whatever the token's user can**, on every project that user reaches. With no token or no project, `live` refuses to start rather than quietly falling back to canned data.

## Test

```bash
uv run pytest
```

No model calls, no CircleCI calls, no credentials needed.

## Recording

The canned data behind `deterministic` and `stub` comes from recorded live runs, not hand-written.

```bash
A2UI_RECORD_DIR=.recordings uv run python -m app --mode live --host localhost
uv run python scripts/record_beats.py --model <model>
uv run python scripts/derive_corpus.py
uv run pytest tests/test_corpus_is_publishable.py
```

Recording needs a failed run in a configured project, and its last step **really reruns** that workflow on CircleCI. Nothing is pseudonymized — the data is a public repository's CI — and the last test fails the recordings if anything token-shaped got in.

## Connecting to A2UIVerse

Launch it from the [A2UIVerse](https://github.com/retz8/a2uiverse) repo with `pnpm dev:agents --only circleci` (add `--mode live` for real data). The launcher finds the agent through the app's [`manifest.json`](../manifest.json) and starts it on the port listed there. Start agents before the platform, because the orchestrator reads each agent card once, at boot. `pnpm dev:all` does both, in that order.
