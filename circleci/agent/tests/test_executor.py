"""The deterministic executor's end-to-end path: an A2A message in, A2UI parts out."""

from tests.helpers import run_executor, run_executor_text


async def test_a_prompt_paints_the_canned_surface():
    payload = await run_executor_text("Say hello")
    ops = [next(k for k in m if k != "version") for m in payload]
    assert ops[0] == "createSurface"
    assert "updateComponents" in ops


async def test_unknown_event_emits_single_text_fallback():
    # A silent no-op looks like a working round-trip that changed nothing.
    payload = await run_executor({"name": "nope", "surfaceId": "s2", "context": {}})
    assert len(payload) == 1
    assert payload[0]["updateComponents"]["components"][0]["text"] == "Unhandled event: nope"
