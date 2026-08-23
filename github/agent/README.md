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

## Recording live runs as fixtures

The agent ships a recorder: with `A2UI_RECORD_DIR` set, every conversation's
streamed A2UI output is captured as the exact batch sequence it was sent, one
file per conversation; unset, the agent behaves identically and writes nothing.
A capture replays just as the live run streamed, so client-side work can be
driven by real agent output with no LLM in the loop. Recording is headless — no
browser involved; the driver runs on the same machine as the agent.

Two layers are involved: the recorder writes a raw per-conversation capture
into `A2UI_RECORD_DIR` (`.recordings/`, gitignored), and the driver script
`scripts/record_beats.py` turns a capture into a tracked fixture — it sends a
scripted prompt, verifies the run actually painted a surface, and finalizes it
under `recordings/beats/` with its metadata (prompt, model, title). Only the
finalized fixtures are tracked.

The tracked set holds one live run of each of the eight **beats** — the
scripted moments of the client demo (open the PR inbox, drill into a PR, and so
on) — and is what the client's canvas verification replays.

### Re-recording the existing beats

The eight beat prompts are defined in the driver, so refreshing a stale fixture
is just running it. The model is fixed when the agent starts, so a beat that
needs a different model is recorded against a separately-started agent:

```bash
# default model
A2UI_RECORD_DIR=.recordings uv run python -m llm_agent --host localhost
uv run python scripts/record_beats.py --beats 1,4,5,7,8 --model gemini-3.7-flash

# stronger model
MODEL_NAME=gemini-3.1-pro-preview A2UI_RECORD_DIR=.recordings \
  uv run python -m llm_agent --host localhost
uv run python scripts/record_beats.py --beats 2,3,6 --model gemini-3.1-pro-preview
```

The driver retries a beat that fails to paint, then records best-available and flags it
in its summary. Beat 3 is defined as a follow-up to beat 2, so asking for it drives both
in one conversation.

### Recording a new beat

1. Add a `Turn(...)` entry to the `BEATS` list in `scripts/record_beats.py`:
   beat number, slug, title, the exact prompt, and `chains=True` if it must run
   as a follow-up inside the previous beat's conversation.
2. Start the agent with the recorder armed (as above).
3. Drive just the new beat: `uv run python scripts/record_beats.py --beats 9
   --model <model the agent runs>`.
4. The fixture lands in `recordings/beats/`; the client bundles that whole
   directory via `import.meta.glob`, so it is picked up with no client code
   change.
