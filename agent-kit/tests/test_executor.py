"""Deterministic-executor mechanics through the in-process harness."""

from pathlib import Path

from a2uiverse_kit.executor_deterministic import DeterministicAgentExecutor
from a2uiverse_kit.responses import fixture_responder

from a2uiverse_kit.testing import run_executor, run_executor_text

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "deterministic"


def _executor() -> DeterministicAgentExecutor:
    build_response, build_text_response = fixture_responder(
        FIXTURES,
        {"greet": "greeting.json"},
        text_fixture="digest.json",
        surface_prefix="test",
    )
    return DeterministicAgentExecutor(build_response, build_text_response)


async def test_an_action_turn_replays_the_mapped_fixture():
    payload = await run_executor(_executor(), {"name": "greet", "surfaceId": "s1"})
    assert payload[0]["updateComponents"]["surfaceId"] == "s1"


async def test_an_unknown_action_answers_with_the_visible_fallback():
    payload = await run_executor(_executor(), {"name": "mystery", "surfaceId": "s1"})
    text = payload[0]["updateComponents"]["components"][0]["text"]
    assert "Unhandled event: mystery" in text


async def test_a_text_turn_answers_with_the_digest_on_a_fresh_surface():
    payload = await run_executor_text(_executor(), "What needs my attention today?")
    assert payload[0]["createSurface"]["surfaceId"] == "test-1"


async def test_every_emitted_part_is_version_tagged():
    payload = await run_executor(_executor(), {"name": "greet", "surfaceId": "s1"})
    assert all(m.get("version") == "v0.9" for m in payload)
