"""Maps an incoming A2UI action or prompt to a canned A2UI response, echoing the surfaceId.

Deterministic mode is the composition harness: its text path answers with the canned list of
the user's issues, and its action map covers what the three beats' surfaces fire (task-7.3
decision 10) — opening an issue, and a status change confirmed or declined. That is what lets
the composed screen be driven end to end with no model call and no Linear quota.

The canned content is derived from a recorded live run (`scripts/derive_corpus.py`), not
authored here. The playing machinery — fixture load, surfaceId stamping, the visible
fallback, fresh text surfaces — is the kit's.
"""

from __future__ import annotations

from pathlib import Path

from a2ui_agent_kit.responses import fixture_responder

_FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures" / "deterministic"

# The action names the beats fire. Everything else falls through to the kit's visible
# "unhandled" fallback rather than a silent no-op.
EVENT_FIXTURES = {
    "open-issue": "open-issue.json",
    "confirm-change": "confirm-change.json",
    "decline-change": "decline-change.json",
}

build_response, build_text_response = fixture_responder(
    _FIXTURES_DIR,
    EVENT_FIXTURES,
    text_fixture="my-issues.json",
    surface_prefix="linear",
)
