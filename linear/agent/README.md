# agent/ — the Linear app's A2A agent

uv-managed Python project (outside the pnpm workspace), on port **11005** in every run mode.
Built on `a2ui-agent-kit` (`../../agent-kit/`, an editable path dependency): the kit carries
the servers, run modes, recorder, and catalog machinery; this project carries what is Linear's —
prompt prose, tool policy, fixtures, knowledge docs, and the agent card (`app/`).

`deterministic` is the **composition harness**: its text path answers with the canned list of
the user's issues and its action map covers the three beats, so the composed screen can be driven
end to end with no LLM call and no Linear quota. `live` turns a natural-language prompt into a
streamed, catalog-valid, data-bound A2UI surface (Gemini via Google ADK), reading issues and
creating, updating or commenting on them through Linear's hosted MCP server. `stub` puts the
model over canned tool data (`app/tools.py`) for work that should not touch Linear.

## Setup

```bash
uv sync
```

## Test

```bash
uv run pytest
```

Tests make zero LLM calls and zero Linear calls: prompt-assembly snapshot, validator, the tool
pin, and the executor against canned responses. No credential is needed to run the suite.

## Setting up the Linear credential

One-time, and outside the agent — it never runs a consent flow.

1. **A personal API key.** In Linear: **Settings → Account → Security & Access**, create a new
   API key with the **Read** and **Write** permissions, and copy it — it is shown once. Put it in
   `agent/.env` as `LINEAR_MCP_TOKEN`. Limiting the key to teams there limits what the agent sees.
2. **The GitHub integration**, for linked pull requests: **Settings → Features → Integrations →
   GitHub**, installed on the repositories whose pull requests the issues should link to.

The key acts as its user: **the agent can do whatever that user can**, within the key's
permissions, on every team the key reaches. The agent refuses to start in `live` mode with no key
— it never degrades silently to canned data, because a convincing surface built from stub
fixtures with no signal that it is not live is worse than a failure.

## Run

One entrypoint, three modes:

```bash
uv run python -m app --mode deterministic   # canned fixtures, no model
uv run python -m app --mode stub            # model over canned tools
uv run python -m app --mode live            # model over Linear's hosted MCP server
```

| Mode            | Needs                                |
| --------------- | ------------------------------------ |
| `deterministic` | nothing                              |
| `stub`          | `GOOGLE_API_KEY`                     |
| `live`          | `GOOGLE_API_KEY`, `LINEAR_MCP_TOKEN` |

Copy `.env.example` to `.env` first (`MODEL_NAME` defaults to `gemini-3.7-flash`).

### What this agent can and cannot do

It reads the user's issues and a team's, one issue's detail with its comments and linked pull
requests, and the team's states, labels and members; it creates an issue, updates one — title,
description, status, priority, assignee, labels — and comments on one. Every write is **proposed
first** and fires only on the user's confirm. It cannot delete an issue or a comment, create a
label, or work with projects, cycles, documents, initiatives or releases.

### The tool inventory, and how to expand it

Of the server's sixty-six tools, ten are admitted, by `LINEAR_TOOLS` in `app/mcp.py` (passed as
the toolset's `tool_filter`). Everything else — the delete and label writes, attachments,
projects, milestones, cycles, documents, initiatives, releases, Linear's pull-request review,
notifications — is withheld because nothing in the app shows it.

Admitting a tool is one change in five places, made together:

1. **Confirm the tool's name and arguments** against a live `tools/list`.
2. **Add it to `LINEAR_TOOLS`** in `app/mcp.py`, and move it out of the withheld comment.
3. **Pin it in `tests/test_llm_mcp.py`**: add it to the admitted set, remove it from `WITHHELD`.
4. **Mirror it in the stub** (`app/tools.py`, added to `STUB_TOOLS`) over a fixture derived from a
   recorded payload, and teach `scripts/derive_corpus.py` to write that fixture.
5. **Describe what it returns** in `app/knowledge/linear-domain.md` — a tool the domain doc never
   describes is a tool the model misreads — and, for a write, give it a proposal in the prompt
   the way the issue writes have one.

A deleting tool belongs with a real authority surface on the platform, not with a filter edit.

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
uv run python scripts/record_beats.py --model gemini-3.7-flash   # the three beats
uv run python scripts/derive_corpus.py                            # stub + deterministic corpora
uv run pytest tests/test_corpus_is_publishable.py
```

The three beats: the user's issues; A2U-5 opened, with its linked pull request and branch; a move
to In Review, proposed and then confirmed. Beat 3 **really changes** A2U-5's status in the
workspace.

The recorded corpus is what the other two run modes are built from: the MCP payloads become
`app/fixtures/stub/` (the stub backend's data) and the settled painted streams become
`app/fixtures/deterministic/`. Neither is hand-authored. Nothing is pseudonymized — the data is
the user's own workspace — and `tests/test_corpus_is_publishable.py` fails the corpus on anything
token-shaped, and on the configured key itself.
