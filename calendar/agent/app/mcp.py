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

The credential is the signed-in account's Google token, held by the agent's sign-in
(task-12.10, `app/sign_in.py`): one toolset per account, its token read again on every call,
so a refreshed token is used at once. Each account reads and writes its own primary calendar
(decision 8); development uses a dedicated test account whose primary calendar
`scripts/seed_calendar.py` populates -- which is why there is no pseudonymizer here, see
`tool_shaping.py`.
"""

from __future__ import annotations

from google.adk.tools.mcp_tool import StreamableHTTPConnectionParams

from a2ui_agent_kit.sign_in import SignedInAccount
from a2ui_agent_kit.toolset import account_bearer

from app.guarded_toolset import GuardedMcpToolset

__all__ = [
    "CALENDAR_MCP_URL",
    "CALENDAR_TOOLS",
    "WITHHELD_TOOLS",
    "build_calendar_toolset",
    "calendar_connection_params",
    "mcp_headers",
]

CALENDAR_MCP_URL = "https://calendarmcp.googleapis.com/mcp/v1"

# Pinned explicitly rather than inherited from the server's full set: the tool surface is a
# statement about what the agent is, so it stays reviewable and diffable. Everything absent
# here is absent deliberately.
#
# Read off the live server on the first run. It exposes nine tools; four are admitted.
#
# Every admitted tool takes `calendarId`; a call that names none is pointed at the person's
# primary calendar (`tool_shaping.default_to_primary`).
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
#                                  credential can see, beyond the primary one.
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


def mcp_headers(access_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {access_token}"}


def calendar_connection_params(account: SignedInAccount) -> StreamableHTTPConnectionParams:
    """Builds the connection parameters passed straight through to McpToolset.

    Pulled out of build_calendar_toolset so the endpoint and the headers -- this branch's
    load-bearing guarantees -- can be asserted directly in tests, at the point where they
    are actually applied, rather than trusted by proxy through the constants alone.
    """
    return StreamableHTTPConnectionParams(
        url=CALENDAR_MCP_URL,
        headers=mcp_headers(account.vendor_token["access_token"]),
    )


def build_calendar_toolset(account: SignedInAccount) -> GuardedMcpToolset:
    """Constructs the Calendar MCP toolset for one signed-in account, with the destructive
    tools filtered out.

    Construction is offline: the toolset stores its connection parameters and builds a
    session manager, connecting only when its tools are first listed.
    """
    return GuardedMcpToolset(
        connection_params=calendar_connection_params(account),
        tool_filter=list(CALENDAR_TOOLS),
        header_provider=account_bearer,
    )
