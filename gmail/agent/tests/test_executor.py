"""The deterministic executor's end-to-end path: an A2A message in, A2UI parts out."""

from pathlib import Path

import pytest

from tests.helpers import run_executor, run_executor_text

OPEN_THREAD = {
    "name": "open-thread",
    "surfaceId": "gmail-1",
    "sourceComponentId": "thread-row",
    "context": {"threadId": "th-1"},
}

# The canned corpus is derived from a live recording run; these skip until one exists.
requires_corpus = pytest.mark.skipif(
    not (Path(__file__).resolve().parents[1] / "app" / "fixtures" / "deterministic").is_dir(),
    reason="deterministic corpus not recorded yet (see agent/README.md)",
)


@requires_corpus
async def test_a_drill_down_round_trips_on_a_fresh_surface():
    # Opening a thread is a new screen, as the live agent paints it: never the acted surface.
    payload = await run_executor(OPEN_THREAD)
    assert payload
    fresh = payload[0]["createSurface"]["surfaceId"]
    assert fresh != "gmail-1"
    for message in payload:
        for key in ("updateComponents", "updateDataModel"):
            if key in message:
                assert message[key]["surfaceId"] == fresh


@requires_corpus
async def test_a_prompt_paints_the_digest():
    payload = await run_executor_text("What needs my attention today?")
    ops = [next(k for k in m if k != "version") for m in payload]
    assert ops[0] == "createSurface"
    assert "updateComponents" in ops


async def test_unknown_event_emits_single_text_fallback():
    # Needs no corpus: the fallback is what an unmapped event produces.
    payload = await run_executor({"name": "nope", "surfaceId": "s2", "context": {}})
    assert len(payload) == 1
    assert payload[0]["updateComponents"]["components"][0]["text"] == "Unhandled event: nope"
