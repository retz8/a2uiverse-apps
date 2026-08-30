"""Maps an incoming A2UI action or prompt to a canned A2UI response, echoing the surfaceId.

This agent's purpose is composition, not per-component coverage (task-2.6 decision 11). Its
text path answers the phase's fan-out utterance with the canned Gmail digest, and its action
map covers exactly what the four beats need — opening a thread, confirming a draft, and
toggling a label. That is what lets the three-agent composed screen be driven end to end with
no LLM call and no Gmail MCP quota, which is the difference between iterating on plan/fill/
collapse in seconds and iterating on it in minutes against three live agents.

The canned content is derived from a live MCP run with the pseudonymizer armed, not authored
here — so it carries real payload shapes and no real mail.
"""

from __future__ import annotations

import json
from itertools import count
from pathlib import Path

_FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"

# The action names the four beats fire. Everything else falls through to _fallback, which is
# a visible "unhandled" rather than a silent no-op.
_EVENT_FIXTURES = {
    "open-thread": "open-thread.json",
    "confirm-draft": "confirm-draft.json",
    "label-toggle": "label-toggle.json",
    "cancel-draft": "cancel-draft.json",
}

# The operation key whose object carries the surfaceId we stamp.
_OPERATION_KEYS = ("updateComponents", "updateDataModel", "createSurface")


def _load_fixture(name: str) -> list[dict]:
    path = _FIXTURES_DIR / name
    if not path.is_file():
        raise FileNotFoundError(
            f"deterministic fixture {name} is missing. The canned corpus is derived from a "
            "live MCP run with the recorder armed; see agent/README.md."
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


# Each prompt creates its own surface (gmail-1, gmail-2, ...): a surfaceId may not be
# re-created on the client, and the stateless executor cannot know what already exists, so
# fresh ids keep every turn renderable.
_surface_counter = count(1)


def build_text_response(text: str) -> list[dict]:
    """The canned digest, for any plain-text prompt.

    The deterministic agent does not route: whatever it is asked, it answers with the digest
    the fan-out beat expects. Discriminating on the utterance would be a second, worse
    router — the live agent is where intent is read.
    """
    messages = _load_fixture("inbox-digest.json")
    return _stamp_surface(messages, f"gmail-{next(_surface_counter)}")
