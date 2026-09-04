# agent/ — the Gmail app's A2A agent

uv-managed Python project (outside the pnpm workspace), on port **11002** in every
run mode. Built on `a2ui-agent-kit` (`../../agent-kit/`, an editable path
dependency): the kit carries the servers, run modes, recorder, and catalog
machinery; this project carries what is Gmail's — prompt prose, tool policy,
fixtures, knowledge docs, and the agent card (`app/`).

`deterministic` is the **composition harness**: its text path answers with the canned
inbox digest and its action map covers the four beats, so the three-agent composed
screen can be driven end to end with no LLM call and no Gmail MCP quota. `live` turns a
natural-language prompt into a streamed, catalog-valid, data-bound A2UI surface (Gemini
via Google ADK), reading and writing the real mailbox through Google's Gmail MCP server.
`stub` puts the model over canned tool data (`app/tools.py`) for work that should not
touch the mailbox.

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
   `gmail.readonly`, `gmail.compose`, and `gmail.modify` **alongside** the Calendar scopes.
   One consent screen serves every Google app in this repo.

3. Mint Application Default Credentials against the project's Desktop client:

   ```bash
   gcloud auth application-default login \
     --client-id-file=$HOME/.config/a2uiverse/oauth-client.json \
     --scopes=https://www.googleapis.com/auth/gmail.readonly,\
   https://www.googleapis.com/auth/gmail.compose,\
   https://www.googleapis.com/auth/gmail.modify,\
   https://www.googleapis.com/auth/calendar.readonly,\
   https://www.googleapis.com/auth/calendar.events,\
   https://www.googleapis.com/auth/cloud-platform
   ```

   `--scopes` **replaces** the granted set rather than adding to it, and every Google app in
   this repo reads the same Application Default Credentials. So this command lists the
   **union of all of them** — Gmail's three and Calendar's two. Running it with only one
   product's scopes silently revokes the other app's access, and that app then fails at
   startup with a credential error that names the wrong cause. A third Google app extends
   this list here **and** in every sibling app's README.

The agent refuses to start on the MCP backend with no usable credential, naming this command
— it never degrades silently to canned data, because a convincing surface built from stub
fixtures with no signal that it is not live is worse than a failure.

## Run

One entrypoint, three modes:

```bash
uv run python -m app --mode deterministic   # canned fixtures, no model
uv run python -m app --mode stub            # model over canned tools
uv run python -m app --mode live            # model over the live Gmail MCP server
```

| Mode | Needs |
| --- | --- |
| `deterministic` | nothing |
| `stub` | `GOOGLE_API_KEY` |
| `live` | `GOOGLE_API_KEY`, ADC, `GOOGLE_CLOUD_PROJECT` |

Copy `.env.example` to `.env` first.

### What this agent can and cannot do

It reads the mailbox, saves drafts, and adds and removes labels. It **cannot send mail** —
the Gmail MCP server exposes no send tool at all — and it **cannot delete or discard**
anything, including drafts it created itself.

Of the server's twenty-three tools, twelve are admitted; trashing, spam marking and
sensitive-label application are withheld by `tool_filter` in `app/mcp.py`. That
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

**Setting `A2UI_RECORD_DIR` also arms pseudonymization** — which is why it matters beyond this
agent's own fixtures. The beats the canvas replays are recorded in the platform repo, through the
composing hub, and that recorder captures whatever the hub relays without being able to tell
whether anything was scrubbed. Starting this agent armed is what keeps real mail out of a tracked
file there; `check:fixtures` in the platform repo is the backstop if it is forgotten. Every Gmail MCP payload passes
through a deterministic, length-preserving substitution (`app/tool_shaping.py`) before
the model sees it, so the model paints stand-in names and subjects natively and no real mail
reaches the recorded stream, the prompt dump, or the model provider. The seed is fixed, so a
re-recorded beat reproduces the same stand-ins and still matches its committed screenshot
baseline.

The recorded corpus is what the other two run modes are built from: the pseudonymized MCP
payloads become `app/fixtures/stub/` (the stub backend's data) and the pseudonymized painted
streams become `app/fixtures/deterministic/`. Neither is hand-authored — that is what keeps
the canned data real-shaped.
