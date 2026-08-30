# agent/ — A2A servers (deterministic + live)

uv-managed Python project (outside the pnpm workspace). The Gmail app's agent, on port
**11002** in every run mode. Hosts two sibling agent packages that share one venv and one
test run:

- `deterministic_agent/` — a canned-response A2A server that closes the event round-trip
  without an LLM. Here it is the **composition harness**: its text path answers with the
  canned inbox digest and its action map covers the four beats, so the three-agent composed
  screen can be driven end to end with no LLM call and no Gmail MCP quota.
- `llm_agent/` — the live LLM agent: it turns a natural-language prompt into a streamed,
  catalog-valid, data-bound A2UI surface (Gemini via Google ADK). Reads and writes the real
  mailbox through Google's Gmail MCP server. A stub toolset (`llm_agent/tools.py`) remains
  available behind `TOOL_BACKEND=stub` for work that should not touch the mailbox.

Catalog locate/load is shared by both agents in `catalog_common/`; validation semantics stay
per-agent (deterministic: non-strict partial probe; live: strict complete-surface).

## Setup

```bash
uv sync
```

## Test

```bash
uv run pytest
```

Tests make zero LLM calls and zero Gmail calls: prompt-assembly snapshot, validator, and the
executor against a faked model stream. No credential is needed to run the suite.

## Setting up the Gmail credential

One-time, and outside the agent — it never holds a secret and never runs a consent flow.

1. Enable the APIs on the preview project:

   ```bash
   gcloud services enable gmail.googleapis.com gmailmcp.googleapis.com \
     --project=a2uiverse-506907
   ```

2. On that project's consent screen (Google Auth Platform → Data Access), add
   `gmail.readonly`, `gmail.compose`, and `gmail.modify`.

3. Mint Application Default Credentials against the project's Desktop client:

   ```bash
   gcloud auth application-default login \
     --client-id-file=$HOME/.config/a2uiverse/oauth-client.json \
     --scopes=https://www.googleapis.com/auth/gmail.readonly,\
   https://www.googleapis.com/auth/gmail.compose,\
   https://www.googleapis.com/auth/gmail.modify,\
   https://www.googleapis.com/auth/cloud-platform
   ```

   `--scopes` **replaces** the granted set rather than adding to it, so list every scope you
   need in one command.

The agent refuses to start on the MCP backend with no usable credential, naming this command
— it never degrades silently to canned data, because a convincing surface built from stub
fixtures with no signal that it is not live is worse than a failure.

## Run the deterministic server

```bash
uv run python -m deterministic_agent --host localhost
```

## Run the live agent

Copy `.env.example` to `.env` first, then:

```bash
uv run python -m llm_agent --host localhost
```

| Scenario | `TOOL_BACKEND` | Needs |
| --- | --- | --- |
| Full agent — live Gmail over MCP | `mcp` (default) | `GOOGLE_API_KEY`, ADC, `GOOGLE_CLOUD_PROJECT` |
| LLM only — canned mailbox data | `stub` | `GOOGLE_API_KEY` |

### What this agent can and cannot do

It reads the mailbox, saves drafts, and adds and removes labels. It **cannot send mail** —
the Gmail MCP server exposes no send tool at all — and it **cannot delete or discard**
anything, including drafts it created itself.

Of the server's twenty-three tools, twelve are admitted; trashing, spam marking and
sensitive-label application are withheld by `tool_filter` in `llm_agent/mcp.py`. That
exclusion is a **single** layer: Gmail has no scope that grants the labelling tools without
also authorizing trash and spam, so the credential permits what the filter withholds.
Admitting the destructive tools is a decision for a real authority surface (M8), not
something to reach for here.

### Serving a browser on another machine

`--base-url` sets the URL the agent card advertises (default `http://<host>:<port>`). Pass
the publicly reachable URL whenever the browser reaches the agent through a host other than
`localhost` — with the default, the card fetch succeeds but the `message/send` POST targets
the wrong host.

## Recording live runs

With `A2UI_RECORD_DIR` set, every conversation's streamed A2UI output is captured as the
exact batch sequence it was sent; unset, the agent behaves identically and writes nothing.

**Setting `A2UI_RECORD_DIR` also arms pseudonymization.** Every Gmail MCP payload passes
through a deterministic, length-preserving substitution (`llm_agent/tool_shaping.py`) before
the model sees it, so the model paints stand-in names and subjects natively and no real mail
reaches the recorded stream, the prompt dump, or the model provider. The seed is fixed, so a
re-recorded beat reproduces the same stand-ins and still matches its committed screenshot
baseline.

The recorded corpus is what the other two run modes are built from: the pseudonymized MCP
payloads become `llm_agent/fixtures/` (the stub backend's data) and the pseudonymized painted
streams become `deterministic_agent/fixtures/`. Neither is hand-authored — that is what keeps
the canned data real-shaped.
