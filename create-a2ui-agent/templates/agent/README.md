# agent/ — the __DISPLAY_NAME__ app's A2A agent

uv-managed Python project, on port **__PORT__** in every run mode. Built on
[`a2ui-agent-kit`](https://github.com/retz8/a2uiverse-apps/tree/main/agent-kit), pinned to a
commit in `pyproject.toml`: the kit carries the servers, run modes, recorder, and catalog
machinery; this project carries what is __DISPLAY_NAME__'s — prompt prose, tool policy,
fixtures, knowledge docs, and the agent card (`app/`).

## Setup

```bash
uv sync
```

## Test

```bash
uv run pytest
```

Tests make zero LLM calls and zero vendor calls: prompt-assembly snapshot, validator, and the
executor against canned responses. No key or credential is needed to run the suite. The first
run writes `tests/golden/llm_system_prompt.skeleton.txt`; commit it, and refresh it deliberately
whenever the prompt framing changes.

## Run

One entrypoint, three modes:

```bash
uv run python -m app --mode deterministic   # canned fixtures, no model
uv run python -m app --mode stub            # model over canned tools
uv run python -m app --mode live            # model over the live __DISPLAY_NAME__ MCP server
```

| Mode            | Needs                                    |
| --------------- | ---------------------------------------- |
| `deterministic` | nothing                                  |
| `stub`          | `GOOGLE_API_KEY`                         |
| `live`          | `GOOGLE_API_KEY` + the vendor credential |

Copy `.env.example` to `.env` first (`MODEL_NAME` defaults to `gemini-3.7-flash`).

> [!IMPORTANT]
> **The live agent acts as its credential's user.** Whatever the MCP server lets that
> credential do, the agent can do — reads and writes alike, under that user's name. Scope the
> credential to the authority you want the agent to have.

A fresh scaffold works before you edit anything: deterministic mode paints a greeting card,
stub mode holds one placeholder tool, and live mode fails fast with a "not wired yet" message
until `app/mcp.py` names the MCP server.

## What to fill in

Every `TODO` marker is a seam the scaffold could not fill for you:

| Where                                 | What                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| `app/card.py`                         | The skills: one per capability, several example utterances each, in the user's words |
| `app/prose.py`                        | The role and scope prose in __DISPLAY_NAME__'s own voice                             |
| `app/knowledge/__APP_ID__-domain.md`  | Domain facts and the decisions that hinge on them                                    |
| `app/knowledge/brand-guidance.md`     | How to compose surfaces that read as __DISPLAY_NAME__'s product UI                   |
| `app/knowledge/examples/`             | Curated example surfaces, one per composition idiom; each is validated by the tests  |
| `app/tools.py` + `app/fixtures/stub/` | A stub mirror of the live tool surface over real-shaped fixtures                     |
| `app/fixtures/deterministic/`         | The canned responses deterministic mode plays (derive them from recorded live runs)  |
| `app/mcp.py`                          | The live MCP server and its credential                                               |

### Serving a browser on another machine

`--base-url` sets the URL the agent card advertises (default `http://<host>:<port>`). Pass
the publicly reachable URL whenever the browser reaches the agent through a host other than
`localhost` — with the default, the card fetch succeeds but the `message/send` POST targets
the wrong host.

## Recording live runs

With `A2UI_RECORD_DIR` set, every conversation's streamed A2UI output is captured as the exact
batch sequence it was sent, one file per conversation; unset, the agent behaves identically and
writes nothing. `scripts/record_beats.py` drives scripted prompts against an armed agent and
finalizes each into a per-beat fixture under `recordings/beats/`.

The recorded corpus is what the other two run modes should be built from: the captured MCP
payloads become `app/fixtures/stub/` and the painted streams become `app/fixtures/deterministic/`.
Never record real personal data into a tracked file — pseudonymize at the source if the vendor
data is personal (the Gmail app in the a2uiverse-apps roster shows how).
