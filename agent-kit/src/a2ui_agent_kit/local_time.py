"""The person's time zone, as A2UIVerse states it.

A2UIVerse tells an app the person's "now" in the words of a question it sends: "The person's
local time is Friday 9 October 2026, 14:20 (Asia/Seoul)." (a2uiverse task-12.13 decision 47).
This reads the zone named there, an IANA name the running Python knows, and binds it for one
run, as the signed-in account is bound: an app's tool code reads it with `current_time_zone`,
to give the times it hands the model in the person's zone, so the model never converts one.
A press carries no words, so the executor keeps the last zone each conversation stated.
"""

from __future__ import annotations

import contextvars
import re
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

_SENTENCE = re.compile(r"The person's local time is [^()]*\(([A-Za-z0-9_+\-/]+)\)\.")

_zone: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "a2ui_agent_kit_time_zone", default=None
)


def time_zone_stated(text: str) -> str | None:
    """The zone the request's words state, or None when they state none Python knows."""
    match = _SENTENCE.search(text or "")
    if match is None:
        return None
    try:
        ZoneInfo(match.group(1))
    except (ZoneInfoNotFoundError, ValueError):
        return None
    return match.group(1)


def bind_time_zone(zone: str | None) -> contextvars.Token:
    return _zone.set(zone)


def unbind_time_zone(token: contextvars.Token) -> None:
    _zone.reset(token)


def current_time_zone() -> str | None:
    """The person's zone for the run, or None when no request in its conversation stated one."""
    return _zone.get()
