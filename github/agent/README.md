# agent/ — the GitHub app's A2A agent

uv-managed Python project (outside the pnpm workspace), on port **11001** in every
run mode. Built on `a2ui-agent-kit` (`../../agent-kit/`, an editable path
dependency): the kit carries the servers, run modes, recorder, and catalog
machinery; this project carries what is GitHub's — prompt prose, tool policy,
fixtures, knowledge docs, and the agent card (`app/`).

## Setup

```bash
uv sync
```

## Test

```bash
uv run pytest
```

Tests make zero LLM calls: prompt-assembly snapshot, validator, and the executor
against a faked model stream. No `GOOGLE_API_KEY` is needed to run the suite.

## Run

One entrypoint, three modes:

```bash
uv run python -m app --mode deterministic   # canned fixtures, no model
uv run python -m app --mode stub            # model over canned tools
uv run python -m app --mode live            # model over the live GitHub MCP server
```

| Mode | Needs |
| --- | --- |
| `deterministic` | nothing |
| `stub` | `GOOGLE_API_KEY` |
| `live` | `GOOGLE_API_KEY`, `GITHUB_MCP_PAT` |

Copy `.env.example` to `.env` first (`MODEL_NAME` defaults to `gemini-3.7-flash`).

> [!IMPORTANT]
> **The live agent acts as your PAT's user.** It connects to the unrestricted
> remote GitHub MCP server with the full tool surface — writes included — and can
> do exactly what the token allows (task-3.7 decision 1): comments, issues,
> reviews, merges, and file edits land under your name, on any repository the
> token reaches. Scope `GITHUB_MCP_PAT` to the authority you want the agent to
> have. Content-bearing writes are proposed on the canvas and fire only on your
> confirmation; quick reversible toggles fire directly.

### When the PAT is dead

A rejected `GITHUB_MCP_PAT` does not surface as an auth error. The MCP toolset fails to load, the
agent starts anyway with no tools, the model then calls a tool that does not exist, and the turn
ends as `MALFORMED_FUNCTION_CALL` with a polite apology on the canvas. The symptom points nowhere
near the cause, so check the token first:

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer $(grep '^GITHUB_MCP_PAT=' .env | cut -d= -f2-)" \
  https://api.github.com/user
```

`200` and the token is fine; `401` and it is expired or revoked. Note that extending an expired
classic token regenerates it — the new value has to be copied into `.env`, or the file keeps a
string GitHub no longer recognises.

### Serving a browser on another machine

`--base-url` sets the URL the agent card advertises (default
`http://<host>:<port>`). Pass the publicly reachable URL whenever the browser
reaches the agent through a host other than `localhost` — with the default, the
card fetch succeeds but the `message/send` POST targets the wrong host.

## Recording live runs

With `A2UI_RECORD_DIR` set, every conversation's streamed A2UI output is captured as the exact
batch sequence it was sent, one file per conversation; unset, the agent behaves identically and
writes nothing. `scripts/record_beats.py` drives scripted prompts against an armed agent.

Nothing is scrubbed on the way through: this agent's recorded corpus was captured from public
repository data. That is unlike the Gmail agent, where the same flag also arms a pseudonymizer.

**The beats the canvas replays are not recorded here.** They live in the platform repo
(`apps/client/recordings/beats/`) and are captured through the composing hub, so they carry the
shell's paint and the composition stamps alongside this agent's output — see that repo's client
README. This recorder is for capturing raw agent output on its own.
