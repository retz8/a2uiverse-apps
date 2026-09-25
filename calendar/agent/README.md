# Google Calendar agent

An A2A agent for Google Calendar. It answers schedule questions by painting A2UI surfaces with [`calendar-catalog`](../calendar-catalog/), the basic A2UI catalog in Calendar's Material 3 look. It runs on port **11003** and is built on the [agent kit](../../agent-kit/).

## What it can do

In `live` mode it works through Google's Calendar MCP server.

- **Reads** events.
- **Creates** an event, shown to you as a proposal first and created only when you confirm.
- **Answers invitations** for you.
- **Can't delete, cancel or change** an existing event.

4 of the server's tools are allowed, listed in `app/mcp.py`. The Google scope would allow more, so a second guard applies in every mode: attendees are never notified. An event created through this agent still exists, but its attendees aren't told about it, and the proposal says so.

## The demo calendar

**The agent never reads your primary calendar.** It reads a demo calendar seeded from [`scripts/seed_events.json`](scripts/seed_events.json), named by `CALENDAR_ID`, and refuses to start without it. Because the content is authored, nothing needs scrubbing before it's recorded.

Create any secondary calendar in the Google account, put its id in `.env` as `CALENDAR_ID`, then seed it:

```bash
uv run python -m scripts.seed_calendar
```

Seeding wipes the calendar and recreates every event relative to today. Re-seed before recording and before any live demo: recording creates events and answers invitations, and dates go stale.

## Run

```bash
uv sync
cp .env.example .env
uv run python -m app --mode deterministic
```

| Mode            | What runs                                 | Needs                                                                 |
| --------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| `deterministic` | canned answers, no model                  | nothing                                                               |
| `stub`          | the model over canned events              | `GOOGLE_API_KEY`                                                      |
| `live`          | the model over the demo calendar, via MCP | `GOOGLE_API_KEY`, `GOOGLE_CLOUD_PROJECT`, `CALENDAR_ID`, Google login |

`deterministic` answers any question with a recorded agenda, and replays the recorded actions: opening an event, confirming or cancelling a new one, answering an invitation. Opening an event paints a new surface, as the live agent does.

Other flags: `--port`, `--host`, and `--base-url`, the address the agent card advertises.

## Google login (live mode)

One-time, outside the agent. The agent never holds a secret.

1. Enable the APIs:

   ```bash
   gcloud services enable calendar-json.googleapis.com calendarmcp.googleapis.com \
     --project=a2uiverse-506907
   ```

2. On the project's consent screen (Google Auth Platform → Data Access), add `calendar.readonly` and `calendar.events`.

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

With no usable login, `live` refuses to start rather than quietly falling back to canned events.

## Test

```bash
uv run pytest
```

No model calls, no Calendar calls, no credentials needed.

## Recording

The canned data behind `deterministic` and `stub` comes from recorded live runs, not hand-written.

```bash
uv run python -m scripts.seed_calendar
A2UI_RECORD_DIR=.recordings uv run python -m app --mode live --host localhost
uv run python scripts/record_beats.py --model <model>
uv run python scripts/derive_corpus.py
uv run pytest tests/test_corpus_is_publishable.py
```

Nothing is pseudonymized: the demo calendar holds nothing private.

## Connecting to A2UIVerse

The agent speaks plain A2UI over A2A. Nothing in it needs [A2UIVerse](https://github.com/retz8/a2uiverse) to run.

- **Launch it** from the `a2uiverse` repo with `pnpm dev:agents --only calendar` (add `--mode live` for the real calendar). The launcher finds the agent through the app's [`manifest.json`](../manifest.json) and starts it on the port listed there. Start agents before the platform, because the orchestrator reads each agent card once, at boot. `pnpm dev:all` does both, in that order.
- **Paint titles.** The prompt asks the model to give each new surface a short title and to mark a surface that asks you something. The kit sends these beside the A2UI as a `paintMeta` data part. A2UIVerse uses the title to name the view, for example on its back arrow, and uses the mark to recognise a question. Other clients ignore the part.
