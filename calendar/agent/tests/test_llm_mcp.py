"""Offline assertions on the remote Calendar MCP wiring (task 2.7).

No test here touches the network: McpToolset connects lazily, so construction is offline.

The tool names themselves are PROVISIONAL until the first live run — nothing in either repo
records this server's inventory (task-2.7 spec, open item 1). So what is pinned here is the
POLICY rather than the vocabulary: how many writes there are and what they are for, that no
tool deletes or amends an existing event, and that the scopes cover both tiers. A name that
turns out wrong should make one of these fail loudly and be fixed by a rename in `mcp.py`
plus a rename here — never by widening the assertion until it passes.
"""

from __future__ import annotations

import pytest

from llm_agent.mcp import (
    CALENDAR_ID_ENV,
    CALENDAR_MCP_URL,
    CALENDAR_SCOPES,
    CALENDAR_TOOLS,
    MissingDemoCalendarError,
    MissingGoogleCredentialError,
    demo_calendar_id,
    mcp_headers,
    quota_project,
)

# The shape of what this agent deliberately does not hold. Calendar's destructive surface is
# worse than Gmail's in one specific way: it reaches third parties. Deleting an event cancels
# it in other people's calendars, where trashing mail is private and reversible.
WITHHELD = {
    "delete_event",
    "update_event",
    "patch_event",
    "move_event",
    "import_event",
    "create_calendar",
    "delete_calendar",
    "clear_calendar",
}


def test_endpoint_is_the_documented_mcp_server():
    assert CALENDAR_MCP_URL == "https://calendarmcp.googleapis.com/mcp/v1"


def test_no_destructive_tool_is_admitted():
    assert WITHHELD.isdisjoint(CALENDAR_TOOLS)


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


def test_the_admitted_set_is_exactly_what_the_beats_need():
    assert set(CALENDAR_TOOLS) == {
        "list_events",
        "get_event",
        "list_calendars",
        "query_freebusy",
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
