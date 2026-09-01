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

_FIXTURES = Path(__file__).resolve().parent / "fixtures" / "stub"


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


def list_events(
    calendarId: str = "",  # noqa: N803 - MCP arg name
    startTime: str = "",  # noqa: N803
    endTime: str = "",  # noqa: N803
    pageSize: int = 25,  # noqa: N803
    orderBy: str = "startTime",  # noqa: N803
    timeZone: str = "",  # noqa: N803
) -> dict:
    """Lists events on the calendar within a time range.

    Args:
        calendarId: The calendar to read. Pinned to the demo calendar in every run mode.
        startTime: RFC 3339 lower bound, inclusive. Empty means the fixture's own range.
        endTime: RFC 3339 upper bound, exclusive. Empty means the fixture's own range.
        pageSize: Maximum events to return. Defaults to 25.
        orderBy: "startTime" or "updated".
        timeZone: The zone to resolve the range in. Empty means the calendar's own.

    Returns:
        An object with an `events` list; each event carries its id, summary, start and end,
        location, attendees and the viewer's own responseStatus.
    """
    payload = _fixture("list-events")
    events = payload.get("events", [])
    return {**payload, "events": events[:pageSize]}


def get_event(eventId: str, calendarId: str = "") -> dict:  # noqa: N803 - MCP arg names
    """Gets one event by id.

    Args:
        eventId: The event's id.
        calendarId: The calendar to read. Pinned to the demo calendar in every run mode.

    Returns:
        The event and its attendees. Returns an object with an "error" key if unknown.
    """
    events = _fixture("get-event")
    event = events.get(eventId)
    if event is None:
        return {"error": f"event {eventId} not found"}
    return event


def create_event(
    summary: str = "",
    startTime: str = "",  # noqa: N803
    endTime: str = "",  # noqa: N803
    calendarId: str = "",  # noqa: N803
    attendeeEmails: list[str] | None = None,  # noqa: N803
    location: str = "",
    description: str = "",
    timeZone: str = "",  # noqa: N803
    allDay: bool = False,  # noqa: N803
) -> dict:
    """Creates an event. In the stub backend nothing is written.

    Args:
        summary: The event's title.
        startTime: RFC 3339 start, or a date for an all-day event.
        endTime: RFC 3339 end, or a date for an all-day event.
        calendarId: The calendar to write to. Pinned to the demo calendar.
        attendeeEmails: Attendee addresses. They are NOT notified.
        location: Where the event is.
        description: The event's notes.
        timeZone: The zone the times are given in.
        allDay: Whether this is an all-day event.

    Returns:
        An Event object with `id` and `htmlLink`.
    """
    return {"id": "stub-event", "htmlLink": "https://example.com/event/stub-event"}


def respond_to_event(
    eventId: str,  # noqa: N803
    responseStatus: str,  # noqa: N803
    calendarId: str = "",  # noqa: N803
    responseComment: str = "",  # noqa: N803
) -> dict:
    """Sets the viewer's own response on an event. In the stub backend nothing is written.

    Args:
        eventId: The event to respond to.
        responseStatus: One of "accepted", "declined", "tentative".
        calendarId: The calendar the event is on. Pinned to the demo calendar.
        responseComment: An optional note sent with the response.

    Returns:
        An object echoing the id and the new responseStatus.
    """
    return {"id": eventId, "responseStatus": responseStatus}


STUB_TOOLS = [
    list_events,
    get_event,
    create_event,
    respond_to_event,
]
