"""Deterministic-executor mechanics through the in-process harness."""

from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

from a2a.server.agent_execution import RequestContext
from a2a.server.events import EventQueue
from a2a.types import TaskState, TaskStatusUpdateEvent

from a2ui_agent_kit.executor_deterministic import DeterministicAgentExecutor
from a2ui_agent_kit.responses import fixture_responder

from a2ui_agent_kit.testing import run_executor, run_executor_text

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


async def test_a_cancel_is_answered_with_a_bare_canceled():
    # task-8.9 decision 3. The SDK answers a task that already completed not cancelable
    # itself; this is the answer to one that lands before the completed final.
    context = MagicMock(spec=RequestContext)
    context.task_id, context.context_id = "t1", "c1"
    queue = MagicMock(spec=EventQueue)
    queue.enqueue_event = AsyncMock()

    await _executor().cancel(context, queue)

    (call,) = queue.enqueue_event.call_args_list
    event = call.args[0]
    assert isinstance(event, TaskStatusUpdateEvent)
    assert (event.task_id, event.context_id) == ("t1", "c1")
    assert event.status.state == TaskState.canceled
    assert event.final is True
    assert event.status.message is None
