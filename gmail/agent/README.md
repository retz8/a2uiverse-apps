# Gmail agent

The Gmail app's A2A agent. It answers mail questions on the A2UIVerse canvas and paints its answers with [`gmail-catalog`](../gmail-catalog/), the basic A2UI catalog in Gmail's Material 3 look. It runs on port **11002** and is built on the [agent kit](../../agent-kit/).

## What it can do

In `live` mode it works through Google's Gmail MCP server.

- **Reads** threads, messages, labels and drafts.
- **Writes** drafts and labels. A draft is proposed on the canvas and saved only when you confirm.
- **Can't send mail**: the Gmail MCP server has no send tool.
- **Can't trash, mark as spam or delete** anything, its own drafts included.

12 of the server's tools are allowed, listed in `app/mcp.py`. That list is the only thing holding back trash and spam, because Gmail has no scope that allows labels without also allowing them.

## Run

```bash
uv sync
cp .env.example .env
uv run python -m app --mode deterministic
```

| Mode            | What runs                                   | Needs                                                  |
| --------------- | ------------------------------------------- | ------------------------------------------------------ |
| `deterministic` | canned answers, no model                    | nothing                                                |
| `stub`          | the model over canned mail                  | `GOOGLE_API_KEY`                                       |
| `live`          | the model over your mailbox, through MCP    | `GOOGLE_API_KEY`, `GOOGLE_CLOUD_PROJECT`, Google login |

`deterministic` answers any question with a recorded inbox digest, and replays the recorded actions: opening a thread, confirming or cancelling a draft, toggling a label. Opening a thread paints a new surface, as the live agent does, so the canvas can step back to the inbox.

You rarely start it by hand: the platform's launcher starts every agent (`pnpm dev:agents` in the `a2uiverse` repo). Other flags: `--port`, `--host`, and `--base-url`, the address the agent card advertises.

## Google login (live mode)

One-time, outside the agent. The agent never holds a secret.

1. Enable the APIs:

   ```bash
   gcloud services enable gmail.googleapis.com gmailmcp.googleapis.com \
     --project=a2uiverse-506907
   ```

2. On the project's consent screen (Google Auth Platform → Data Access), add `gmail.readonly`, `gmail.compose` and `gmail.modify`.

3. Log in with Application Default Credentials:

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

> [!WARNING]
> Gmail and Calendar share one Google login, and `--scopes` replaces what was granted before. Always log in with **both** apps' scopes, as above. Otherwise the other app loses access and fails at startup with an error that points elsewhere.

With no usable login, `live` refuses to start rather than quietly falling back to canned mail.

## Test

```bash
uv run pytest
```

No model calls, no Gmail calls, no credentials needed.

## Recording

The canned data behind `deterministic` and `stub` comes from recorded live runs, not hand-written.

```bash
A2UI_RECORD_DIR=.recordings uv run python -m app --mode live --host localhost
uv run python scripts/record_beats.py --model <model>
uv run python scripts/derive_corpus.py
uv run pytest tests/test_corpus_is_publishable.py
```

**Setting `A2UI_RECORD_DIR` also turns on pseudonymization.** Every mail payload gets stand-in names and subjects before the model sees it, so no real mail reaches the recordings or the model provider. The stand-ins are seeded, so re-recording gives the same ones. Start this agent with it set whenever the platform records its canvas replays too — that's what keeps real mail out of them.
