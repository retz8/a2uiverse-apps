# agent/ — the CircleCI app's A2A agent

uv-managed Python project (outside the pnpm workspace), on port **11004** in every run mode.
Built on `a2ui-agent-kit` (`../../agent-kit/`, an editable path dependency): the kit carries
the servers, run modes, recorder, and catalog machinery; this project carries what is
CircleCI's — prompt prose, tool policy, fixtures, knowledge docs, and the agent card (`app/`).

`deterministic` is the **composition harness**: its text path answers with the canned recent
runs and its action map covers the four beats, so the composed screen can be driven end to end
with no LLM call and no CircleCI quota. `live` turns a natural-language prompt into a streamed,
catalog-valid, data-bound A2UI surface (Gemini via Google ADK), reading pipelines and rerunning
or canceling workflows through CircleCI's hosted MCP server. `stub` puts the model over canned
tool data (`app/tools.py`) for work that should not touch CircleCI.

## Setup

```bash
uv sync
```

## Test

```bash
uv run pytest
```

Tests make zero LLM calls and zero CircleCI calls: prompt-assembly snapshot, validator, the
tool pin, and the executor against canned responses. No credential is needed to run the suite.

## Setting up the CircleCI credential

One-time, and outside the agent — it never runs a consent flow.

1. **A personal API token.** In CircleCI: **User settings → Personal API Tokens → Create New
   Token**, name it, set an expiry (at most a year), **Add API Token**, and copy it — it is shown
   once. Put it in `agent/.env` as `CIRCLECI_MCP_TOKEN`.
2. **The projects.** The hosted server has no tool that lists projects, and a project created
   through CircleCI's GitHub App is found only by its id — its `gh/<org>/<repo>` slug does not
   resolve. List each project in `agent/.env` as `CIRCLECI_PROJECTS=<repository>=<project-id>`,
   comma-separated; the id is the project's UUID in its CircleCI project settings.

The token carries no scopes: **the agent can do whatever the token's user can**, on every
project that user reaches. The agent refuses to start in `live` mode with no token or no project
— it never degrades silently to canned data, because a convincing surface built from stub
fixtures with no signal that it is not live is worse than a failure.

## Run

One entrypoint, three modes:

```bash
uv run python -m app --mode deterministic   # canned fixtures, no model
uv run python -m app --mode stub            # model over canned tools
uv run python -m app --mode live            # model over CircleCI's hosted MCP server
```

| Mode            | Needs                                                       |
| --------------- | ----------------------------------------------------------- |
| `deterministic` | nothing                                                     |
| `stub`          | `GOOGLE_API_KEY`                                            |
| `live`          | `GOOGLE_API_KEY`, `CIRCLECI_MCP_TOKEN`, `CIRCLECI_PROJECTS` |

Copy `.env.example` to `.env` first (`MODEL_NAME` defaults to `gemini-3.7-flash`).

### What this agent can and cannot do

It reads a project's pipeline runs, each run's workflows, each workflow's jobs, and a job's
logs; it reruns a workflow — every job, or only the failed ones — and cancels a running one.
Both writes are **proposed first** and fire only on the user's confirm. It cannot edit config,
trigger a pipeline on a new commit, approve a hold, or delete anything.

### The tool inventory, and how to expand it

Of the server's twenty-four tools, nine are admitted, by `CIRCLECI_TOOLS` in `app/mcp.py`
(passed as the toolset's `tool_filter`); the agent also holds `list_projects`, a local tool over
`CIRCLECI_PROJECTS`. Everything else — job tests, artifacts and resource usage, the deploy
subsystem with its rollback, orbs, config validation, usage export — is withheld because nothing
in the app shows it.

Admitting a tool is one change in five places, made together:

1. **Confirm the tool's name and arguments** against a live `tools/list` — the documented names
   have drifted from the server's before.
2. **Add it to `CIRCLECI_TOOLS`** in `app/mcp.py`, and move it out of the withheld comment.
3. **Pin it in `tests/test_llm_mcp.py`**: add it to the admitted set, remove it from `WITHHELD`.
4. **Mirror it in the stub** (`app/tools.py`, added to `STUB_TOOLS`) over a fixture derived from a
   recorded payload, and teach `scripts/derive_corpus.py` to write that fixture.
5. **Describe what it returns** in `app/knowledge/circleci-domain.md` — a tool the domain doc
   never describes is a tool the model misreads — and, for a write, give it a proposal in the
   prompt the way rerun and cancel have one.

A destructive tool (`rollback_deploy_component` is the one the server marks destructive beside
`cancel_workflow`) belongs with a real authority surface on the platform, not with a filter edit.

### Serving a browser on another machine

`--base-url` sets the URL the agent card advertises (default `http://<host>:<port>`). Pass the
publicly reachable URL whenever the browser reaches the agent through a host other than
`localhost` — with the default, the card fetch succeeds but the `message/send` POST targets the
wrong host.

## Recording live runs

With `A2UI_RECORD_DIR` set, every conversation's streamed A2UI output is captured as the exact
batch sequence it was sent, and every MCP result is captured as it returns; unset, the agent
behaves identically and writes nothing.

```bash
A2UI_RECORD_DIR=.recordings uv run python -m app --mode live --host localhost
uv run python scripts/record_beats.py --model gemini-3.7-flash   # the four beats
uv run python scripts/derive_corpus.py                            # stub + deterministic corpora
uv run pytest tests/test_corpus_is_publishable.py
```

The four beats: the recent runs; the most recent failed run opened; its failed job's step and
log; a rerun of only the failed jobs, proposed and then confirmed. Beat 3 needs a failed run in a
configured project, and beat 4 **really reruns** that workflow on CircleCI.

The recorded corpus is what the other two run modes are built from: the MCP payloads become
`app/fixtures/stub/` (the stub backend's data) and the settled painted streams become
`app/fixtures/deterministic/`. Neither is hand-authored. Nothing is pseudonymized — the data is
a public repository's CI — and `tests/test_corpus_is_publishable.py` fails the corpus on anything
token-shaped, and on the configured token or key themselves.
