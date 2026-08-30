"""Stub Calendar toolset: canned, real-shaped agenda data.

A mirror of the Calendar read/write surface the beats need, over fixtures captured from live
MCP against the seeded demo calendar (task-2.7 decisions 4 and 5) -- so the canned data is
derived from real payloads rather than invented, and carries nothing private, because the
demo calendar holds nothing private to begin with.

The stub exists so client work, prompt iteration and beat replay need not touch Google or
consume MCP call allowance. It is always an explicit opt-in (`TOOL_BACKEND=stub`).

Writes are accepted and acknowledged but change nothing: a stub `create_event` returns an
event id without an event existing. That is the point -- the round-trip is exercised, the
calendar is not.
"""

from __future__ import annotations

import functools
import json
from pathlib import Path

_FIXTURES = Path(__file__).resolve().parent / "fixtures"


@functools.lru_cache(maxsize=8)
def _fixture(name: str) -> dict:
    path = _FIXTURES / f"{name}.json"
    if not path.is_file():
        raise FileNotFoundError(
            f"stub fixture {path.name} is missing. The stub corpus is derived from a live "
            "MCP run against the seeded demo calendar with the recorder armed; see "
            "agent/README.md."
        )
    return json.loads(path.read_text(encoding="utf-8"))


def list_events(timeMin: str = "", timeMax: str = "", maxResults: int = 25) -> dict:  # noqa: N803 - MCP arg names
    """Lists events on the calendar within a time range.

    Args:
        timeMin: RFC 3339 lower bound, inclusive. Empty means the fixture's own range.
        timeMax: RFC 3339 upper bound, exclusive. Empty means the fixture's own range.
        maxResults: Maximum events to return. Defaults to 25.

    Returns:
        An object with an `events` list; each event carries its id, summary, start and end,
        location, attendees and the viewer's own responseStatus.
    """
    payload = _fixture("list-events")
    events = payload.get("events", [])
    return {**payload, "events": events[:maxResults]}


def get_event(eventId: str) -> dict:  # noqa: N803 - MCP arg name
    """Gets one event by id.

    Args:
        eventId: The event's id.

    Returns:
        The event and its attendees. Returns an object with an "error" key if unknown.
    """
    events = _fixture("get-event")
    event = events.get(eventId)
    if event is None:
        return {"error": f"event {eventId} not found"}
    return event


def list_calendars() -> dict:
    """Lists the calendars the credential can see.

    Returns:
        An object with a `calendars` list of {id, summary, primary, accessRole}.
    """
    return _fixture("list-calendars")


def query_freebusy(timeMin: str = "", timeMax: str = "") -> dict:  # noqa: N803 - MCP arg names
    """Reports busy intervals within a time range.

    Args:
        timeMin: RFC 3339 lower bound, inclusive.
        timeMax: RFC 3339 upper bound, exclusive.

    Returns:
        An object with a `busy` list of {start, end}.
    """
    return _fixture("query-freebusy")


def create_event(
    summary: str = "",
    start: str = "",
    end: str = "",
    attendees: list[str] | None = None,
    location: str = "",
    description: str = "",
) -> dict:
    """Creates an event. In the stub backend nothing is written.

    Args:
        summary: The event's title.
        start: RFC 3339 start, or a date for an all-day event.
        end: RFC 3339 end, or a date for an all-day event.
        attendees: Attendee addresses.
        location: Where the event is.
        description: The event's notes.

    Returns:
        An Event object with `id` and `htmlLink`.
    """
    return {"id": "stub-event", "htmlLink": "https://example.com/event/stub-event"}


def respond_to_event(eventId: str, responseStatus: str) -> dict:  # noqa: N803 - MCP arg names
    """Sets the viewer's own response on an event. In the stub backend nothing is written.

    Args:
        eventId: The event to respond to.
        responseStatus: One of "accepted", "declined", "tentative".

    Returns:
        An object echoing the id and the new responseStatus.
    """
    return {"id": eventId, "responseStatus": responseStatus}


STUB_TOOLS = [
    list_events,
    get_event,
    list_calendars,
    query_freebusy,
    create_event,
    respond_to_event,
]
