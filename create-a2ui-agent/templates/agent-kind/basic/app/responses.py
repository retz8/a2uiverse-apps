"""Maps an incoming A2UI action or prompt to a canned A2UI response, echoing the surfaceId.

Deterministic mode is the composition harness: it answers any prompt with the canned greeting
surface and covers the one action that surface carries, so the app can be driven end to end
with no model call and no vendor quota. The playing machinery — fixture load, surfaceId
stamping, the visible fallback, fresh text surfaces — is the kit's.

TODO: replace the greeting with fixtures derived from recorded live runs, and map each action
your surfaces fire to the response it plays.
"""

from __future__ import annotations

from pathlib import Path

from a2ui_agent_kit.responses import fixture_responder

_FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures" / "deterministic"

# The action names the canned surfaces fire. Everything else falls through to the kit's
# visible "unhandled" fallback rather than a silent no-op.
EVENT_FIXTURES = {
    "greet": "greet.json",
}

build_response, build_text_response = fixture_responder(
    _FIXTURES_DIR,
    EVENT_FIXTURES,
    text_fixture="greeting.json",
    surface_prefix="__APP_ID__",
)
