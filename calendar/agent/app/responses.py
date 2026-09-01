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
calendar holds nothing private (task-2.7 decision 4). The playing machinery — fixture load,
surfaceId stamping, the visible fallback, fresh text surfaces — is the kit's.
"""

from __future__ import annotations

from pathlib import Path

from a2uiverse_kit.responses import fixture_responder

_FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures" / "deterministic"

# The action names the four beats fire. Everything else falls through to the kit's
# visible "unhandled" fallback rather than a silent no-op.
_EVENT_FIXTURES = {
    "open-event": "open-event.json",
    "confirm-event": "confirm-event.json",
    "rsvp-toggle": "rsvp-toggle.json",
    "cancel-event": "cancel-event.json",
}

build_response, build_text_response = fixture_responder(
    _FIXTURES_DIR,
    _EVENT_FIXTURES,
    text_fixture="agenda-digest.json",
    surface_prefix="calendar",
)
