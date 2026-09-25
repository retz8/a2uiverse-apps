# Google Calendar agent

An A2A agent for Google Calendar. It answers schedule questions by painting A2UI surfaces with [`calendar-catalog`](../calendar-catalog/), the basic A2UI catalog in Calendar's Material 3 look. It runs on port **11003** and is built on [`a2ui-agent-kit`](../../agent-kit/).

## What it can do

In `live` mode it works through Google's Calendar MCP server, on one calendar only (see below).

- **Reads** events.
- **Creates** an event, shown to you as a proposal first and created only when you confirm.
- **Answers invitations** for you.
- **Never notifies attendees.** Invitations and updates aren't emailed, so a proposed event says its attendees won't be told.
- **Can't delete, cancel or change** an existing event.

It's allowed 4 of the server's tools: `list_events`, `get_event`, `create_event` and `respond_to_event`.

## Demo calendar

**The agent reads one calendar only: the one `CALENDAR_ID` names**, and it refuses to start without it. Out of the box that's a demo calendar seeded from [`scripts/seed_events.json`](scripts/seed_events.json), never your main one. Because the content is authored, nothing needs scrubbing before it's recorded.

Create any secondary calendar in the Google account, put its id in `.env` as `CALENDAR_ID`, then seed it:

```bash
uv run python -m scripts.seed_calendar
```

Seeding wipes the calendar and recreates every event relative to today. Re-seed before recording and before any live demo: recording creates events and answers invitations, and dates go stale.

**Using your own calendar.** Set `CALENDAR_ID` to its id: your Google account's email address for your main calendar, or the Calendar ID under a calendar's Settings → Integrate calendar. Then:

- **Never run the seed script.** It deletes every event on the calendar `CALENDAR_ID` names.
- **Don't record.** Recordings are committed to this repo, and nothing in them is scrubbed.

Attendees are still never notified: an event the agent creates, or an invitation it answers, reaches no one's inbox.

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

## Allowing more tools

The allowed tools are `CALENDAR_TOOLS` in `app/mcp.py`; the rest of the server's tools are in `WITHHELD_TOOLS` beside it. The Google login's `calendar.events` scope already covers changing and deleting events, so that list is what limits the agent.

To allow a tool, change these together:

1. Check its name and arguments against the server's live `tools/list`.
2. Move it from `WITHHELD_TOOLS` to `CALENDAR_TOOLS` in `app/mcp.py`.
3. Update the pin in `tests/test_llm_mcp.py`.
4. Add it to the stub, `STUB_TOOLS` in `app/tools.py`, over data from a recorded run (`scripts/derive_corpus.py` writes it).
5. Describe what it returns in `app/knowledge/calendar-domain.md`. For a write, add a proposal to the prompt, so it runs only when you confirm.

Every call still stays on the calendar `CALENDAR_ID` names and notifies no one; `app/tool_shaping.py` enforces both.

## Connecting to A2UIVerse

Launch it from the [A2UIVerse](https://github.com/retz8/a2uiverse) repo with `pnpm dev:agents --only calendar` (add `--mode live` for the real calendar). The launcher finds the agent through the app's [`manifest.json`](../manifest.json) and starts it on the port listed there. Start agents before the platform, because the orchestrator reads each agent card once, at boot. `pnpm dev:all` does both, in that order.
