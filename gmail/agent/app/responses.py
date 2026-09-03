"""Maps an incoming A2UI action or prompt to a canned A2UI response, echoing the surfaceId.

This agent's purpose is composition, not per-component coverage (task-2.6 decision 11). Its
text path answers the phase's fan-out utterance with the canned Gmail digest, and its action
map covers exactly what the four beats need — opening a thread, confirming a draft, and
toggling a label. That is what lets the three-agent composed screen be driven end to end with
no LLM call and no Gmail MCP quota, which is the difference between iterating on plan/fill/
collapse in seconds and iterating on it in minutes against three live agents.

The canned content is derived from a live MCP run with the pseudonymizer armed, not authored
here — so it carries real payload shapes and no real mail. The playing machinery — fixture
load, surfaceId stamping, the visible fallback, fresh text surfaces — is the kit's.
"""

from __future__ import annotations

from pathlib import Path

from a2ui_agent_kit.responses import fixture_responder

_FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures" / "deterministic"

# The action names the four beats fire. Everything else falls through to the kit's
# visible "unhandled" fallback rather than a silent no-op.
_EVENT_FIXTURES = {
    "open-thread": "open-thread.json",
    "confirm-draft": "confirm-draft.json",
    "label-toggle": "label-toggle.json",
    "cancel-draft": "cancel-draft.json",
}

build_response, build_text_response = fixture_responder(
    _FIXTURES_DIR,
    _EVENT_FIXTURES,
    text_fixture="inbox-digest.json",
    surface_prefix="gmail",
)
