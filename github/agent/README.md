# agent/ — A2A servers (deterministic + live)

uv-managed Python project (outside the pnpm workspace). The GitHub app's agent, on
port **11001** in every run mode. Hosts two sibling agent packages that share one
venv and one test run:

- `deterministic_agent/` — a canned-response A2A server that closes the event
  round-trip without an LLM — a permanent token-free local-test harness.
- `llm_agent/` — the live LLM agent: it turns a natural-language prompt into a
  streamed, catalog-valid, data-bound A2UI surface (Gemini via Google ADK). Reads live
  GitHub through the official remote GitHub MCP server (read-only). A stub
  toolset (`llm_agent/tools.py`) remains available behind `TOOL_BACKEND=stub` for work
  that should not consume GitHub call allowance.

Catalog locate/load is shared by both agents in `catalog_common/`; validation semantics
stay per-agent (deterministic: non-strict partial probe; live: strict complete-surface).

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

## Run the deterministic server

```bash
uv run python -m deterministic_agent --host localhost
```

## Run the live agent

Copy `.env.example` to `.env` first (`MODEL_NAME` defaults to
`gemini-3.7-flash`), pick a scenario, then:

```bash
uv run python -m llm_agent --host localhost
```

| Scenario | `TOOL_BACKEND` | Required env |
| --- | --- | --- |
| Full agent — live GitHub over MCP | `mcp` (default) | `GOOGLE_API_KEY`, `GITHUB_MCP_PAT` |
| LLM only — canned tool data, no GitHub calls | `stub` | `GOOGLE_API_KEY` |

- `GITHUB_MCP_PAT` is a fine-grained GitHub PAT with read-only access to public
  repositories; the agent reads GitHub through the official remote GitHub MCP
  server and refuses to start if the PAT is missing while `TOOL_BACKEND` is
  `mcp`.
- The stub backend returns canned, real-shaped fixture data — useful for
  prompt/client work that should not consume GitHub call allowance.

> [!IMPORTANT]
> The agent is **read-only toward GitHub regardless of your PAT's scopes**. It
> connects to the read-only variant of the remote GitHub MCP server
> (`llm_agent/mcp.py`), so write tools — merging, reviewing, editing — never
> enter its tool inventory. A PAT minted with write permissions gains nothing.

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

### Removing the read-only restriction

Read-only is enforced in layers; granting write access means changing each one
deliberately:

1. **Endpoint** — in `llm_agent/mcp.py`, change `GITHUB_MCP_URL` from
   `https://api.githubcopilot.com/mcp/readonly` to the unrestricted
   `https://api.githubcopilot.com/mcp/`, which serves the write tools.
2. **Toolset pin** — in the same file, extend `GITHUB_MCP_TOOLSETS` if the
   write tools you need live outside the pinned six (the unrestricted
   `pull_requests` toolset already includes merge and review-write).
3. **PAT** — mint `GITHUB_MCP_PAT` with the write permissions you need; the
   server can only do what the token allows.
4. **Prompt** — `llm_agent/prompt.py` tells the model twice that every tool it
   holds is read-only; rewrite those statements or the model will refuse
   write-shaped requests.
5. **Guard tests** — `tests/test_llm_mcp.py` pins the read-only URL and the
   toolset tuple; update its assertions to the new contract so the suite is
   green again.

## Recording live runs

With `A2UI_RECORD_DIR` set, every conversation's streamed A2UI output is captured as the exact
batch sequence it was sent, one file per conversation; unset, the agent behaves identically and
writes nothing. `scripts/record_beats.py` drives scripted prompts against an armed agent.

Nothing is scrubbed on the way through, and nothing needs to be: this agent reads public
repositories through the read-only GitHub MCP server. That is unlike the Gmail agent, where the
same flag also arms a pseudonymizer.

**The beats the canvas replays are not recorded here.** They live in the platform repo
(`apps/client/recordings/beats/`) and are captured through the composing hub, so they carry the
shell's paint and the composition stamps alongside this agent's output — see that repo's client
README. This recorder is for capturing raw agent output on its own.

