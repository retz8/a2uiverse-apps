"""Maps an incoming A2UI action or prompt to a canned A2UI response, echoing the surfaceId.

Deterministic mode is the composition harness: its text path answers with the canned recent
runs, and its action map covers exactly what the four beats need (task-7.2 decision 10) —
opening a run, opening a failed job, and a rerun proposed then confirmed or declined. That is
what lets the composed screen be driven end to end with no model call and no CircleCI quota.

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
    "open-run": "open-run.json",
    "open-job": "open-job.json",
    "rerun-workflow": "rerun-workflow.json",
    "confirm-rerun": "confirm-rerun.json",
    "decline-rerun": "decline-rerun.json",
}

build_response, build_text_response = fixture_responder(
    _FIXTURES_DIR,
    EVENT_FIXTURES,
    text_fixture="recent-runs.json",
    surface_prefix="circleci",
)
