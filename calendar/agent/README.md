# agent/ — the Google Calendar app's A2A agent

uv-managed Python project (outside the pnpm workspace), on port **11003** in every
run mode. Built on `a2ui-agent-kit` (`../../agent-kit/`, an editable path
dependency): the kit carries the servers, run modes, recorder, and catalog
machinery; this project carries what is Calendar's — prompt prose, tool policy,
fixtures, knowledge docs, and the agent card (`app/`).

`deterministic` is the **composition harness**: its text path answers with the canned
agenda and its action map covers the four beats, so the three-agent composed screen can
be driven end to end with no LLM call and no Calendar MCP quota. `live` turns a
natural-language prompt into a streamed, catalog-valid, data-bound A2UI surface (Gemini
via Google ADK), reading and writing a real calendar through Google's Calendar MCP
server. `stub` puts the model over canned tool data (`app/tools.py`) for work that should
not touch Google at all.

## Setup

```bash
uv sync
```

## Test

```bash
uv run pytest
```

Tests make zero LLM calls and zero Calendar calls: prompt-assembly snapshot, validator, and
the executor against a faked model stream. No credential is needed to run the suite.

## The demo calendar

**The agent never reads `primary`.** It reads a seeded demo calendar whose events are
authored and tracked in this repo (task-2.7 decision 4), and it fails at startup if
`CALENDAR_ID` is unset rather than falling back to anything.

That is the whole of this app's privacy story, and it replaces the pseudonymizer the Gmail
agent needs. An account has exactly one mailbox, so reading Gmail live means reading real
mail and every payload has to be scrubbed before it can reach a public repo. Calendar is not
shaped like that: `calendarId` is a first-class parameter and one account holds many
calendars. So the corpus here is clean **by construction** rather than by a substitution pass
whose completeness nobody can prove.

What that costs is recorded rather than glossed: the payload *shapes* are real, because they
come from the real API, but the *content* is authored. Phase decision 1's "derived from real
MCP payloads, not invented" holds for everything that teaches the model a field exists, and
not for the values in those fields.

Create the calendar once (any secondary calendar in the project's account), put its id in
`.env`, then seed it:

```bash
uv run python -m scripts.seed_calendar
```

The seed corpus (`scripts/seed_events.json`) dates every event **relative to the run date**,
and seeding **wipes and recreates**. Both matter: a calendar is dates, so an absolutely-dated
seed is an empty agenda a few months later and the live demo shows nothing; and the two write
beats mutate the calendar, so without a wipe each recording run degrades the fixture source it
was recorded from.

Re-seed before recording beats and before any live demo.

## Setting up the Calendar credential

One-time, and outside the agent — it never holds a secret and never runs a consent flow.

1. Enable the APIs on the preview project:

   ```bash
   gcloud services enable calendar-json.googleapis.com calendarmcp.googleapis.com \
     --project=a2uiverse-506907
   ```

2. On that project's consent screen (Google Auth Platform → Data Access), add
   `calendar.readonly` and `calendar.events` **alongside** the Gmail scopes already there.
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
uv run python -m app --mode live            # model over the live Calendar MCP server
```

| Mode | Needs |
| --- | --- |
| `deterministic` | nothing |
| `stub` | `GOOGLE_API_KEY` |
| `live` | `GOOGLE_API_KEY`, ADC, `GOOGLE_CLOUD_PROJECT`, `CALENDAR_ID` |

Copy `.env.example` to `.env` first.

### What this agent can and cannot do

It reads the calendar, creates an event from a proposal the user confirms, and answers an
invitation on the user's behalf. It **cannot delete or cancel** anything, and it **cannot
change an event that already exists**.

The admitted inventory is pinned by `tool_filter` in `app/mcp.py`: the reads, event
creation, and the attendee-response tool. Deletion and every tool that modifies an existing
event are withheld.

**Two layers, not one.** The tool filter is the first, and on its own it is as thin as
Gmail's: `calendar.events` grants full CRUD including deletion, and the narrower
`calendar.events.owned` cannot cover the response tool at all, because a response is made on
an event the user does not own. So the credential permits what the filter withholds.

The second layer is real, and Gmail had no equivalent. Calendar's writes reach third parties
— creating an event mails its attendees and changes their calendars, where trashing mail is
private and reversible — so every outbound call has its notification parameter forced to a
non-notifying value in `app/tool_shaping.py`, in every run mode. Stated precisely: **it
stops the invitations, it does not stop the event existing.** An event created through this
agent is one its attendees do not know about, which is why the prompt requires the proposal
to say so on the surface.

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

Setting it also arms **corpus capture**: each Calendar MCP payload the model reads is
appended to `.recordings/payloads/`. Unlike the Gmail agent, nothing is rewritten on the way
through — there is no pseudonymizer, because the demo calendar has nothing to pseudonymize.

The recorded corpus is what the other two run modes are built from: the captured MCP payloads
become `app/fixtures/stub/` (the stub backend's data) and the recorded painted streams become
`app/fixtures/deterministic/`. Neither is hand-authored — that is what keeps the canned data
real-shaped.

```bash
uv run python -m scripts.record_beats
uv run python -m scripts.derive_corpus
```
