"""Offline assertions on the remote Calendar MCP wiring (task 2.7).

McpToolset connects lazily, so construction is offline; the one test that connects talks to
a local server standing in for Calendar's.

The inventory was read off the live server (task-2.7 spec, open item 1 — resolved): it
exposes nine tools, of which four are admitted. The provisional guesses that preceded that
run were wrong in two ways worth remembering, because both tests below exist for them: there
was no `query_freebusy`, and `search_events`/`list_calendars` take no `calendarId` at all —
so they reach every calendar the account can see.
"""

from __future__ import annotations

import pytest
from a2ui_agent_kit.sign_in import SignedInAccount, VendorSignInEnded
from a2ui_agent_kit.testing import serve_unauthorized
from a2ui_agent_kit.toolset import account_bearer

import app.mcp
from app.mcp import CALENDAR_MCP_URL, CALENDAR_TOOLS, WITHHELD_TOOLS, build_calendar_toolset
from app.sign_in import GOOGLE_SCOPES

ACCOUNT = SignedInAccount(
    "sub-1", "g-1", {"email": "you@example.com"}, frozenset({"calendar.read"}),
    vendor_token={"access_token": "ya29.x"},
)

# The server's nine tools, as read off it live. Named in full so that a tool APPEARING or
# DISAPPEARING upstream is a visible diff here rather than a silent change in what the agent
# can do.
SERVER_TOOLS = {
    "list_events",
    "get_event",
    "search_events",
    "list_calendars",
    "create_event",
    "update_event",
    "delete_event",
    "respond_to_event",
    "suggest_time",
}


def test_endpoint_is_the_documented_mcp_server():
    assert CALENDAR_MCP_URL == "https://calendarmcp.googleapis.com/mcp/v1"


def test_no_destructive_tool_is_admitted():
    assert set(WITHHELD_TOOLS).isdisjoint(CALENDAR_TOOLS)


def test_the_admitted_and_withheld_sets_account_for_the_whole_server():
    # Every tool the server offers is either taken or refused on purpose. A tool that is in
    # neither set is one nobody decided about.
    assert set(CALENDAR_TOOLS) | set(WITHHELD_TOOLS) == SERVER_TOOLS


def test_every_admitted_tool_works_on_one_calendar():
    # Each admitted tool takes a calendarId, pointed at the primary calendar when the call
    # names none. search_events and list_calendars do NOT, and stay withheld.
    assert set(CALENDAR_TOOLS).isdisjoint({"search_events", "list_calendars"})


def test_nothing_that_amends_an_existing_event_is_admitted():
    # The agent proposes and creates; it never edits. Rescheduling is out of scope for 2.7,
    # and an update tool appearing here would let the model do it without a proposal.
    assert not any(
        verb in tool for tool in CALENDAR_TOOLS for verb in ("update", "patch", "move", "delete")
    )


def test_exactly_two_writes_are_admitted_one_per_tier():
    # Decision 1's taxonomy, pinned: one creating write (confirm-gated) and one toggling
    # write (fires directly). A third write means a tier nobody designed.
    writes = {"create_event", "respond_to_event"}
    assert writes.issubset(CALENDAR_TOOLS)
    assert len(set(CALENDAR_TOOLS) - writes) == len(CALENDAR_TOOLS) - 2


def test_no_tool_that_invents_a_time_is_admitted():
    # suggest_time proposes times the model never read. The prompt's hardest rule is that a
    # time on a surface came from a payload, and a tool whose purpose is to invent one
    # undercuts it more quietly than a wrong answer would.
    assert "suggest_time" not in CALENDAR_TOOLS


def test_the_admitted_set_is_exactly_what_the_beats_need():
    assert set(CALENDAR_TOOLS) == {
        "list_events",
        "get_event",
        "create_event",
        "respond_to_event",
    }


def test_writing_asks_google_for_calendar_events():
    # calendar.events is what BOTH write tiers need. There is no narrower scope for either: it
    # grants deletion too, and calendar.events.owned cannot cover the response tool at all,
    # because a response is made on an event the user does not own. That is why the filter is
    # a single layer and the notification guard is the second one.
    assert GOOGLE_SCOPES["calendar.write"] == ["https://www.googleapis.com/auth/calendar.events"]
    assert GOOGLE_SCOPES["calendar.read"] == [
        "https://www.googleapis.com/auth/calendar.events.readonly"
    ]


def test_the_toolset_is_the_accounts_with_no_quota_project_header():
    toolset = build_calendar_toolset(ACCOUNT)
    assert toolset._connection_params.url == CALENDAR_MCP_URL
    assert toolset._connection_params.headers == {"Authorization": "Bearer ya29.x"}
    assert toolset.header_provider is account_bearer


async def test_calendar_refusing_the_token_ends_the_accounts_sign_in(monkeypatch):
    async with serve_unauthorized() as url:
        monkeypatch.setattr(app.mcp, "CALENDAR_MCP_URL", url)
        with pytest.raises(VendorSignInEnded):
            await build_calendar_toolset(ACCOUNT).get_tools()
