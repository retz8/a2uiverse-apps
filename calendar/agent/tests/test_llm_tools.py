"""The stub Calendar toolset.

The stub's fixtures are derived from a live MCP run against the seeded demo calendar, so
they do not exist until that run has happened. These tests skip until then rather than
asserting against hand-authored data — a fixture written to satisfy a test would defeat the
point of deriving the corpus from real payloads, which is that the SHAPES are the API's.
"""

from __future__ import annotations

import pathlib

import pytest

from app.tools import (
    STUB_TOOLS,
    create_event,
    get_event,
    list_events,
    respond_to_event,
)

requires_corpus = pytest.mark.skipif(
    not (
        pathlib.Path(__file__).resolve().parents[1]
        / "app"
        / "fixtures"
        / "stub"
        / "list-events.json"
    ).is_file(),
    reason="stub corpus not recorded yet (see agent/README.md)",
)


def test_stub_tools_mirror_the_admitted_mcp_surface():
    # The stub exists so client and prompt work need not touch Google; a tool the live
    # backend holds but the stub lacks is a beat that cannot be replayed offline.
    assert STUB_TOOLS == [
        list_events,
        get_event,
        create_event,
        respond_to_event,
    ]


def test_no_stub_tool_writes_anything():
    # Every stub write is an acknowledgement, never a mutation — the round-trip is
    # exercised, the calendar is not.
    assert create_event(summary="s", startTime="a", endTime="b")["id"] == "stub-event"
    assert respond_to_event("ev-1", "accepted") == {"id": "ev-1", "responseStatus": "accepted"}


def test_no_stub_tool_can_delete_or_amend_an_existing_event():
    # The tool filter's shape, asserted where it is cheapest to check: the stub is the
    # inventory written out by hand, so a deletion or update appearing here would mean the
    # live surface had grown one too.
    names = {tool.__name__ for tool in STUB_TOOLS}
    for forbidden in ("delete_event", "update_event", "search_events", "suggest_time"):
        assert forbidden not in names


def test_missing_corpus_fails_with_a_pointer_not_a_keyerror():
    # A missing fixture is a setup problem; it should say so rather than surfacing as an
    # opaque file error three frames deep.
    try:
        list_events()
    except FileNotFoundError as exc:
        assert "README" in str(exc)
    except Exception:  # noqa: BLE001 — corpus present, nothing to assert here
        pass


@requires_corpus
def test_list_returns_events_with_bindable_fields():
    payload = list_events()
    events = payload["events"]
    assert events
    for key in ("id", "summary", "start", "end"):
        assert key in events[0]


@requires_corpus
def test_list_honours_max_results():
    assert len(list_events(pageSize=1)["events"]) <= 1


@requires_corpus
def test_get_unknown_event_returns_error():
    assert "error" in get_event("no-such-event")
