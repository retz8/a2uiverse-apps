"""Maps an incoming A2UI action or prompt to a canned A2UI response, echoing the surfaceId.

This agent's purpose is composition, not per-component coverage (task-2.6 decision 11). Its
text path answers the phase's fan-out utterance with the canned Calendar agenda, and its
action map covers exactly what the four beats need — opening an event, confirming a proposed
event, and answering an invitation. That is what lets the three-agent composed screen be
driven end to end with no LLM call and no Calendar MCP quota, which is the difference between
iterating on plan/fill/collapse in seconds and iterating on it in minutes against three live
agents.

The canned content is derived from a live MCP run against the seeded demo calendar, not
authored here — so it carries real payload shapes, and nothing private, because the demo
calendar holds nothing private (task-2.7 decision 4).
"""

from __future__ import annotations

import json
from itertools import count
from pathlib import Path

_FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"

# The action names the four beats fire. Everything else falls through to _fallback, which is
# a visible "unhandled" rather than a silent no-op.
_EVENT_FIXTURES = {
    "open-event": "open-event.json",
    "confirm-event": "confirm-event.json",
    "rsvp-toggle": "rsvp-toggle.json",
    "cancel-event": "cancel-event.json",
}

# The operation key whose object carries the surfaceId we stamp.
_OPERATION_KEYS = ("updateComponents", "updateDataModel", "createSurface")


def _load_fixture(name: str) -> list[dict]:
    path = _FIXTURES_DIR / name
    if not path.is_file():
        raise FileNotFoundError(
            f"deterministic fixture {name} is missing. The canned corpus is derived from a "
            "live MCP run against the seeded demo calendar with the recorder armed; see "
            "agent/README.md."
        )
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _stamp_surface(messages: list[dict], surface_id: str) -> list[dict]:
    for msg in messages:
        for key in _OPERATION_KEYS:
            if key in msg:
                msg[key]["surfaceId"] = surface_id
    return messages


def _fallback(name: str, surface_id: str) -> list[dict]:
    return [
        {
            "version": "v0.9",
            "updateComponents": {
                "surfaceId": surface_id,
                "components": [
                    {"id": "label", "component": "Text", "text": f"Unhandled event: {name}"}
                ],
            },
        }
    ]


def build_response(action: dict) -> list[dict]:
    name = action.get("name", "")
    surface_id = action.get("surfaceId", "")
    fixture = _EVENT_FIXTURES.get(name)
    if fixture is None:
        return _fallback(name, surface_id)
    return _stamp_surface(_load_fixture(fixture), surface_id)


# Each prompt creates its own surface (calendar-1, calendar-2, ...): a surfaceId may not be
# re-created on the client, and the stateless executor cannot know what already exists, so
# fresh ids keep every turn renderable.
_surface_counter = count(1)


def build_text_response(text: str) -> list[dict]:
    """The canned agenda, for any plain-text prompt.

    The deterministic agent does not route: whatever it is asked, it answers with the agenda
    the fan-out beat expects. Discriminating on the utterance would be a second, worse
    router — the live agent is where intent is read.
    """
    messages = _load_fixture("agenda-digest.json")
    return _stamp_surface(messages, f"calendar-{next(_surface_counter)}")
