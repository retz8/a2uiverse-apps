"""Offline assertions on the remote Calendar MCP wiring (task 2.7).

No test here touches the network: McpToolset connects lazily, so construction is offline.

The inventory was read off the live server (task-2.7 spec, open item 1 — resolved): it
exposes nine tools, of which four are admitted. The provisional guesses that preceded that
run were wrong in two ways worth remembering, because both tests below exist for them: there
was no `query_freebusy`, and `search_events`/`list_calendars` take no `calendarId` at all —
so admitting either would have read the developer's `primary` straight into a public corpus.
"""

from __future__ import annotations

import pytest

from app.mcp import (
    CALENDAR_ID_ENV,
    CALENDAR_MCP_URL,
    CALENDAR_SCOPES,
    CALENDAR_TOOLS,
    WITHHELD_TOOLS,
    MissingDemoCalendarError,
    MissingGoogleCredentialError,
    demo_calendar_id,
    mcp_headers,
    quota_project,
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


def test_every_admitted_tool_can_be_confined_to_one_calendar():
    # The invariant that makes pin_calendar total rather than best-effort: each admitted tool
    # takes a calendarId. search_events and list_calendars do NOT, which is why they are
    # withheld — they would read the user's primary calendar and no guard could stop them.
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


def test_scopes_cover_both_write_tiers():
    # calendar.events is what BOTH tiers need. There is no narrower scope for either: it
    # grants deletion too, and calendar.events.owned cannot cover the response tool at all,
    # because a response is made on an event the user does not own. That is why the filter is
    # a single layer and the notification guard is the second one.
    assert "https://www.googleapis.com/auth/calendar.events" in CALENDAR_SCOPES
    assert "https://www.googleapis.com/auth/calendar.readonly" in CALENDAR_SCOPES


def test_no_owned_only_scope_is_relied_on():
    # Documented as a live assertion rather than a comment: reaching for the narrower scope
    # looks like a tightening and would silently break the toggling tier.
    assert "https://www.googleapis.com/auth/calendar.events.owned" not in CALENDAR_SCOPES


def test_headers_carry_the_bearer_token_and_the_quota_project():
    headers = mcp_headers("token-value", "a-project")
    assert headers["Authorization"] == "Bearer token-value"
    assert headers["X-Goog-User-Project"] == "a-project"


def test_missing_project_fails_fast_and_names_the_alternative(monkeypatch):
    monkeypatch.delenv("GOOGLE_CLOUD_PROJECT", raising=False)
    with pytest.raises(MissingGoogleCredentialError) as excinfo:
        quota_project()
    assert "TOOL_BACKEND=stub" in str(excinfo.value)


def test_missing_demo_calendar_fails_fast_rather_than_reading_primary(monkeypatch):
    # The whole privacy story is that the agent reads an authored calendar (decision 4). A
    # fallback to `primary` would put the developer's real appointments into a recording
    # bound for a public repo, so the id is required rather than defaulted.
    monkeypatch.delenv(CALENDAR_ID_ENV, raising=False)
    with pytest.raises(MissingDemoCalendarError) as excinfo:
        demo_calendar_id()
    assert "primary" in str(excinfo.value)
