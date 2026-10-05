# Google Calendar agent

An A2A agent for Google Calendar. It answers schedule questions by painting A2UI surfaces with [`calendar-catalog`](../calendar-catalog/), Calendar's own components in Material 3's design language. It runs on port **11003** and is built on [`a2ui-agent-kit`](../../agent-kit/).

## What it can do

In `live` mode it works through Google's Calendar MCP server, on the signed-in person's primary calendar.

- **Reads** events.
- **Creates** an event, shown to you as a proposal first and created only when you confirm.
- **Answers invitations** for you.
- **Never notifies attendees.** Invitations and updates aren't emailed, so a proposed event says its attendees won't be told.
- **Can't delete, cancel or change** an existing event.

It's allowed 4 of the server's tools: `list_events`, `get_event`, `create_event` and `respond_to_event`.

## Demo calendar

**Each signed-in account works on its own primary calendar.** Recordings and live demos use a dedicated test Google account whose primary calendar is a demo calendar seeded from [`scripts/seed_events.json`](scripts/seed_events.json). Because the content is authored, nothing needs scrubbing before it's recorded.

To seed it, sign the test account in to the agent in `live` mode through A2UIVerse, and allow it to add events (ask it to add one). Then:

```bash
uv run python -m scripts.seed_calendar --account <test account email>
```

The script uses the test account's Google token from the agent's sign-in store. Seeding wipes that account's primary calendar and recreates every event relative to today. Re-seed before recording and before any live demo: recording creates events and answers invitations, and dates go stale.

- **Never seed your own account.** It deletes every event on its primary calendar.
- **Don't record your own calendar.** Recordings are committed to this repo, and nothing in them is scrubbed.

Attendees are never notified: an event the agent creates, or an invitation it answers, reaches no one's inbox.

## Run

```bash
uv sync
cp .env.example .env
uv run python -m app --mode deterministic
```

| Mode            | What runs                                 | Needs                                                                     |
| --------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| `deterministic` | canned answers, no model                  | nothing                                                                   |
| `stub`          | the model over canned events              | `GOOGLE_API_KEY`                                                          |
| `live`          | the model over your calendar, via MCP     | `GOOGLE_API_KEY`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` |

`deterministic` answers any question with a recorded agenda, and replays the recorded actions: opening an event, confirming or cancelling a new one, answering an invitation. Opening an event paints a new surface, as the live agent does.

Other flags: `--port`, `--host`, and `--base-url`, the address the agent card advertises. `--state-dir` moves the sign-in store from `.state/`.

## Signing in

The agent is its own sign-in: A2UIVerse signs in to it, and it signs in to Google. Its card asks for two scopes, in the words A2UIVerse shows when it asks you:

| Scope            | Shown as                                           | Asked                                               |
| ---------------- | -------------------------------------------------- | --------------------------------------------------- |
| `calendar.read`  | See your calendar                                  | at the first sign-in                                |
| `calendar.write` | Add events and answer invitations on your calendar | the first time you add an event or answer an invite |

In `deterministic` and `stub` mode the sign-in offers one made-up account, `you@example.com`. In `deterministic` mode, confirming an event or answering an invitation asks for `calendar.write`.

In `live` mode the sign-in sends you to Google. The agent keeps your Google token, refreshes it, and gives A2UIVerse a token of its own. It asks Google for `calendar.events.readonly` at first and `calendar.events` to write, with `openid`, `email` and `profile` to know who signed in.

### Setting up live sign-in

Gmail's README sets up the Google Cloud project and its OAuth client, shared by both apps (["Setting up live sign-in"](../../gmail/agent/README.md#setting-up-live-sign-in)). For Calendar, in the same project:

1. **Enable the APIs:**

   ```bash
   gcloud services enable calendar-json.googleapis.com calendarmcp.googleapis.com \
     --project=<your-project-id>
   ```

2. **On the consent screen**, under Data Access, add `calendar.events.readonly` and `calendar.events`.

3. **On the OAuth client**, make sure `http://localhost:11003/sign-in/finish` is an Authorized redirect URI (or the tunnel address the agent runs at with `--base-url`, followed by `/sign-in/finish`).

4. **Put the client's ID and secret** in `.env` as `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`.

> [!NOTE]
> While the client is in Testing, Google ends each sign-in after 7 days, and A2UIVerse asks you to sign in again.

## Test

```bash
uv run pytest
```

No model calls, no Calendar calls, no credentials needed.

## Recording

The canned data behind `deterministic` and `stub` comes from recorded live runs, not hand-written.

```bash
uv run python -m scripts.seed_calendar --account <test account email>
A2UI_RECORD_DIR=.recordings uv run python -m app --mode live --host localhost
uv run python scripts/record_beats.py --model <model>
uv run python scripts/derive_corpus.py --account <test account email>
uv run pytest tests/test_corpus_is_publishable.py
```

Sign the test account in through A2UIVerse first. Nothing is pseudonymized: the demo calendar holds nothing private.

To repaint the beats after a catalog change, record them against the stub instead: the model paints over the recorded data, nothing reaches Google Calendar, and only the deterministic corpus is derived again.

```bash
A2UI_RECORD_DIR=.recordings uv run python -m app --mode stub --host localhost
uv run python scripts/record_beats.py --model <model>
uv run python scripts/derive_corpus.py --beats-only
uv run pytest tests/test_corpus_is_publishable.py
```

## Allowing more tools

The allowed tools are `CALENDAR_TOOLS` in `app/mcp.py`; the rest of the server's tools are in `WITHHELD_TOOLS` beside it. The sign-in's `calendar.events` scope already covers changing and deleting events, so that list is what limits the agent.

To allow a tool, change these together:

1. Check its name and arguments against the server's live `tools/list`.
2. Move it from `WITHHELD_TOOLS` to `CALENDAR_TOOLS` in `app/mcp.py`.
3. Update the pin in `tests/test_llm_mcp.py`.
4. Add it to the stub, `STUB_TOOLS` in `app/tools.py`, over data from a recorded run (`scripts/derive_corpus.py` writes it).
5. Describe what it returns in `app/knowledge/calendar-domain.md`. For a write, add a proposal to the prompt, so it runs only when you confirm.

Every call still notifies no one, and a call naming no calendar goes to the primary one; `app/tool_shaping.py` does both. A write also needs its tool in `tool_scopes` in `app/sign_in.py`.

## Connecting to A2UIVerse

Launch it from the [A2UIVerse](https://github.com/retz8/a2uiverse) repo with `pnpm dev:agents --only calendar` (add `--mode live` for the real calendar). The launcher starts the agent on the port its roster gives the app, the `default_port` in [`app/config.py`](app/config.py), packs the catalog with Stellify, and installs the app into the running A2UIVerse from the agent's card. `pnpm dev:all` starts A2UIVerse and the agents together.
