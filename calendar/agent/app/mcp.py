"""Remote Calendar MCP toolset: read-write, with the destructive tools withheld (task 2.7).

The inventory is pinned client-side by `tool_filter`: the reads, event creation, and the
attendee-response tool. Deletion, and any tool that notifies attendees about an existing
event, are excluded. Admitting them is a decision for a real authority surface (M8), not a
scope grant.

**The scope ladder collapses to a single layer, as Gmail's does, and for a sharper reason.**
`calendar.events` grants full CRUD including deletion, and there is no scope beneath it that
grants creation without it. The narrower `calendar.events.owned` cannot cover the toggling
tier at all: a response is made on an event the user is an attendee of and does not own. So
the credential permits what this filter withholds.

**Unlike Gmail, a second layer is available here, and it is taken.** Calendar's writes reach
third parties -- creating or changing an event mails its attendees and changes their calendars,
where trashing mail is private and reversible. Every admitted write therefore has its
notification parameter forced to a non-notifying value in `tool_shaping.suppress_notifications`
before the call leaves this process. That is a real second barrier and this says so rather
than implying more than it does: it stops the invitations, it does not stop the event
existing. An event created this way is one its attendees do not know about, and the painted
proposal is required to say so (see `knowledge/calendar-domain.md`).

The credential is Application Default Credentials, minted once by a developer outside the
agent (`gcloud auth application-default login`). The agent reads it and lets the library
refresh it; it never sees a client secret and never runs a consent flow.

The agent reads a **seeded demo calendar**, not the developer's own (task-2.7 decision 4):
`CALENDAR_ID_ENV` names it, and `scripts/seed_calendar.py` populates it. That is why there is
no pseudonymizer here -- see `tool_shaping.py`.
"""

from __future__ import annotations

import os

import google.auth
import google.auth.exceptions
import google.auth.transport.requests
from google.adk.tools.mcp_tool import StreamableHTTPConnectionParams

from app.guarded_toolset import GuardedMcpToolset
from app.tool_shaping import CALENDAR_ID_ENV

CALENDAR_MCP_URL = "https://calendarmcp.googleapis.com/mcp/v1"

# The scopes the credential must carry. `calendar.events` is what both write tiers need; no
# narrower scope grants the attendee response, because that happens on an event the user does
# not own.
CALENDAR_SCOPES = (
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/cloud-platform",
)

# Pinned explicitly rather than inherited from the server's full set: the tool surface is a
# statement about what the agent is, so it stays reviewable and diffable. Everything absent
# here is absent deliberately.
#
# Read off the live server on the first run. It exposes nine tools; four are admitted.
#
# EVERY ADMITTED TOOL TAKES `calendarId`, and that is load-bearing rather than incidental:
# it is what lets `tool_shaping.pin_calendar` confine the whole surface to the seeded demo
# calendar. A tool without that argument cannot be confined, and would read the developer's
# `primary` — which is the one thing task-2.7 decision 4 exists to prevent.
CALENDAR_TOOLS = (
    # reads
    "list_events",
    "get_event",
    # creating write -- painted as a proposal, fires on the user's confirm action
    "create_event",
    # toggling write -- fires directly on its action
    "respond_to_event",
)

# Withheld, with the reason, because each is a different kind of refusal:
#
#   delete_event, update_event  -- destructive and amending. They reach third parties:
#                                  deleting cancels the event in other people's calendars.
#                                  Rescheduling is out of scope for 2.7 (decision 1).
#   search_events               -- takes NO calendarId, so it searches every calendar the
#                                  credential can see, `primary` included. Not confinable.
#   list_calendars              -- likewise takes no calendarId, and returns the user's other
#                                  calendars by name. No beat needs it.
#   suggest_time                -- proposes times the model never read. The prompt's hardest
#                                  rule is that a time on a surface came from a payload; a
#                                  tool whose whole purpose is to invent one undercuts it.
WITHHELD_TOOLS = (
    "delete_event",
    "update_event",
    "search_events",
    "list_calendars",
    "suggest_time",
)

PROJECT_ENV_VAR = "GOOGLE_CLOUD_PROJECT"



class MissingGoogleCredentialError(RuntimeError):
    """Raised when the MCP backend is selected with no usable credential."""


class MissingDemoCalendarError(RuntimeError):
    """Raised when the MCP backend is selected with no demo calendar to read."""


def quota_project() -> str:
    """The project billed for the call, sent as X-Goog-User-Project."""
    project = os.environ.get(PROJECT_ENV_VAR)
    if not project:
        raise MissingGoogleCredentialError(
            f"{PROJECT_ENV_VAR} is not set. The live agent sends it as the "
            "X-Goog-User-Project header on every Calendar MCP call; set it in agent/.env. "
            "To run against canned fixture data instead, set TOOL_BACKEND=stub."
        )
    return project


def demo_calendar_id() -> str:
    """The seeded demo calendar the agent reads (task-2.7 decision 4).

    Fails fast rather than silently falling back to `primary`: `primary` is the developer's
    own calendar, and a run that quietly read it would put real personal events into a
    recording bound for a public repo. The whole point of the seeded calendar is that there
    is nothing private to leak, and that guarantee is worthless if the id is optional.
    """
    calendar_id = os.environ.get(CALENDAR_ID_ENV)
    if not calendar_id:
        raise MissingDemoCalendarError(
            f"{CALENDAR_ID_ENV} is not set. The live agent reads a seeded demo calendar, "
            "never `primary` -- see scripts/seed_calendar.py and agent/README.md. "
            "To run against canned fixture data instead, set TOOL_BACKEND=stub."
        )
    return calendar_id


def access_token() -> str:
    """Mints a fresh access token from ADC, failing fast rather than degrading to canned data.

    A silent fallback would render a convincing surface from stub fixtures with no signal
    that it is not live, so the stub is only ever a deliberate choice.
    """
    try:
        credentials, _ = google.auth.default(scopes=list(CALENDAR_SCOPES))
    except google.auth.exceptions.DefaultCredentialsError as exc:
        raise MissingGoogleCredentialError(
            "No Application Default Credentials. The live agent needs a user credential "
            "carrying the Calendar scopes:\n\n  "
            + "\n  ".join(CALENDAR_SCOPES)
            + "\n\n"
            "Mint it with the command in agent/README.md, 'Setting up the Calendar "
            "credential'. Do NOT run `gcloud auth application-default login` with only "
            "these scopes: --scopes REPLACES the granted set, and every Google app in this "
            "repo shares one credential, so a Calendar-only grant revokes the Gmail "
            "agent's. The README's command lists the union.\n\n"
            "To run against canned fixture data instead, set TOOL_BACKEND=stub."
        ) from exc
    credentials.refresh(google.auth.transport.requests.Request())
    if not credentials.token:
        raise MissingGoogleCredentialError(
            "Application Default Credentials produced no access token. Re-run "
            "`gcloud auth application-default login` with the Calendar scopes."
        )
    return credentials.token


def mcp_headers(token: str, project: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "X-Goog-User-Project": project,
    }


def calendar_connection_params() -> StreamableHTTPConnectionParams:
    """Builds the connection parameters passed straight through to McpToolset.

    Pulled out of build_calendar_toolset so the endpoint and the headers -- this branch's
    load-bearing guarantees -- can be asserted directly in tests, at the point where they
    are actually applied, rather than trusted by proxy through the constants alone.
    """
    return StreamableHTTPConnectionParams(
        url=CALENDAR_MCP_URL,
        headers=mcp_headers(access_token(), quota_project()),
    )


def build_calendar_toolset() -> GuardedMcpToolset:
    """Constructs the Calendar MCP toolset with the destructive tools filtered out.

    Construction is offline: the toolset stores its connection parameters and builds a
    session manager, connecting only when its tools are first listed.

    Reading the demo calendar id here rather than at call time means a missing id fails at
    startup, next to the missing-credential failure, instead of mid-turn.
    """
    demo_calendar_id()
    return GuardedMcpToolset(
        connection_params=calendar_connection_params(),
        tool_filter=list(CALENDAR_TOOLS),
    )
