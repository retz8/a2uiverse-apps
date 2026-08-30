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

from llm_agent.guarded_toolset import GuardedMcpToolset

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
# here is absent deliberately -- see the module docstring.
#
# PROVISIONAL until the first live run. Nothing in either repo records this server's real
# inventory (task-2.7 spec, open item 1), so these names are the Calendar API's own surface as
# the MCP server is expected to project it. `tests/test_llm_mcp.py` pins the POLICY -- reads
# plus exactly the two writes the beats need, no deletion, no notifying tool -- so a name that
# turns out wrong is a rename here, not a redesign.
CALENDAR_TOOLS = (
    # reads
    "list_events",
    "get_event",
    "list_calendars",
    "query_freebusy",
    # creating write -- painted as a proposal, fires on the user's confirm action
    "create_event",
    # toggling write -- fires directly on its action
    "respond_to_event",
)

# Withheld deliberately: delete_event, update_event, move_event, import_event,
# create_calendar, delete_calendar, clear_calendar, and every tool that mails attendees about
# an event that already exists.

PROJECT_ENV_VAR = "GOOGLE_CLOUD_PROJECT"
CALENDAR_ID_ENV = "CALENDAR_ID"


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
            "carrying the Calendar scopes; mint one with:\n\n"
            "  gcloud auth application-default login \\\n"
            "    --client-id-file=$HOME/.config/a2uiverse/oauth-client.json \\\n"
            f"    --scopes={','.join(CALENDAR_SCOPES)}\n\n"
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
