# CircleCI agent

An A2A agent for CircleCI. It answers CI questions by painting A2UI surfaces with [`circleci-catalog`](../circleci-catalog/), CircleCI's own set of A2UI components in its look. It runs on port **11004** and is built on [`a2ui-agent-kit`](../../agent-kit/).

## What it can do

In `live` mode it works through CircleCI's hosted MCP server.

- **Reads** a project's pipeline runs, each run's workflows, each workflow's jobs, and a job's log.
- **Reruns** a workflow, either every job or only the failed ones, and **cancels** a running one. Both are shown to you as a proposal first and run only when you confirm.
- **Can't** edit config, trigger a new pipeline, approve a hold, or delete anything.

It's allowed 9 of the server's tools: the run, workflow and job reads, `rerun_workflow` and `cancel_workflow`. It also has `list_projects`, a local tool that asks CircleCI's API for the projects you follow.

## Run

```bash
uv sync
cp .env.example .env
uv run python -m app --mode deterministic
```

| Mode            | What runs                            | Needs            |
| --------------- | ------------------------------------ | ---------------- |
| `deterministic` | canned answers, no model             | nothing          |
| `stub`          | the model over canned CI data        | `GOOGLE_API_KEY` |
| `live`          | the model over CircleCI's hosted MCP | `GOOGLE_API_KEY` |

`deterministic` answers any question with the recorded recent runs, and replays the recorded actions: opening a run, opening a job, proposing a rerun and confirming or declining it. Opening a run or a job paints a new surface, as the live agent does.

Other flags: `--port`, `--host`, and `--base-url`, the address the agent card advertises. `--state-dir` moves the sign-in store from `.state/`.

## Signing in

The agent is its own sign-in: A2UIVerse signs in to it, and it signs in to CircleCI. Its card asks for two scopes, in the words A2UIVerse shows when it asks you:

| Scope             | Shown as                                    | Asked                                  |
| ----------------- | ------------------------------------------- | -------------------------------------- |
| `pipelines.read`  | See your projects, pipelines and their runs | at the first sign-in                   |
| `pipelines.write` | Rerun and cancel your workflows             | the first time you rerun or cancel one |

In `deterministic` and `stub` mode the sign-in offers one made-up account, `retz8`. In `deterministic` mode, confirming a rerun asks for `pipelines.write`.

In `live` mode the sign-in sends you to CircleCI. The agent keeps your CircleCI token and gives A2UIVerse a token of its own; CircleCI's sign-in carries no scopes, so the two above are the agent's own. There is nothing to set up at CircleCI: on the first sign-in the agent registers itself with CircleCI's sign-in server and keeps the registration in `.state/`. CircleCI gives no way to refresh its token, so when it ends, A2UIVerse asks you to sign in again.

The projects are the ones you follow on CircleCI, asked of CircleCI's API with your token. To have the agent cover a project, follow it on CircleCI.

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

Sign in through A2UIVerse first. Recording needs a failed run in a project you follow, and its last step **really reruns** that workflow on CircleCI. Nothing is pseudonymized, since the data is a public repository's CI, and the last test fails the recordings if anything token-shaped got in.

To repaint the beats after a catalog change, record them against the stub instead: the model paints over the recorded data, nothing reaches CircleCI, and only the deterministic corpus is derived again.

```bash
A2UI_RECORD_DIR=<scratch dir> uv run python -m app --mode stub --port <free port> --host localhost
uv run python scripts/record_beats.py --model <model> --record-dir <scratch dir> --url http://localhost:<free port>
uv run python scripts/derive_corpus.py --beats-only
```

## Allowing more tools

The allowed tools are `CIRCLECI_TOOLS` in `app/mcp.py`. CircleCI's sign-in has no scopes, so that list is what limits the agent.

To allow a tool, change these together:

1. Check its name and arguments against the server's live `tools/list`.
2. Add it to `CIRCLECI_TOOLS` in `app/mcp.py`, and take it out of the withheld comment.
3. Update the pin in `tests/test_llm_mcp.py`.
4. Add it to the stub, `STUB_TOOLS` in `app/tools.py`, over data from a recorded run (`scripts/derive_corpus.py` writes it).
5. Describe what it returns in `app/knowledge/circleci-domain.md`. For a write, add a proposal to the prompt, so it runs only when you confirm, and the tool to `tool_scopes` in `app/sign_in.py`.

## Connecting to A2UIVerse

Launch it from the [A2UIVerse](https://github.com/retz8/a2uiverse) repo with `pnpm dev:agents --only circleci` (add `--mode live` for real data). The launcher starts the agent on the port its roster gives the app, the `default_port` in [`app/config.py`](app/config.py), packs the catalog with Stellify, and installs the app into the running A2UIVerse from the agent's card. `pnpm dev:all` starts A2UIVerse and the agents together.
