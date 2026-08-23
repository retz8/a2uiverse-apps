"""In-process harness: run the executor and reconstruct its emitted A2UI payload."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

from a2a.server.agent_execution import RequestContext
from a2a.server.events import EventQueue
from a2a.types import DataPart, Message, Part, Role
from a2ui.a2a.parts import get_a2ui_datapart, is_a2ui_part

from deterministic_agent.executor import DeterministicAgentExecutor


def _incoming_message(action: dict) -> Message:
    return Message(
        message_id="test-msg",
        role=Role.user,
        parts=[Part(root=DataPart(data={"version": "v0.9", "action": action}))],
        kind="message",
    )


def _parts_from_event(event) -> list:
    status = getattr(event, "status", None)
    message = getattr(status, "message", None) if status is not None else None
    return list(getattr(message, "parts", []) or [])


async def run_executor(action: dict) -> list[dict]:
    context = MagicMock(spec=RequestContext)
    context.message = _incoming_message(action)
    context.current_task = None

    queue = MagicMock(spec=EventQueue)
    queue.enqueue_event = AsyncMock()

    await DeterministicAgentExecutor().execute(context, queue)

    payload: list[dict] = []
    for call in queue.enqueue_event.call_args_list:
        event = call.args[0]
        for part in _parts_from_event(event):
            if is_a2ui_part(part):
                payload.append(get_a2ui_datapart(part).data)
    return payload


def _incoming_text_message(text: str) -> Message:
    from a2a.types import TextPart

    return Message(
        message_id="test-msg",
        role=Role.user,
        parts=[Part(root=TextPart(text=text))],
        kind="message",
    )


async def run_executor_text(text: str) -> list[dict]:
    context = MagicMock(spec=RequestContext)
    context.message = _incoming_text_message(text)
    context.current_task = None

    queue = MagicMock(spec=EventQueue)
    queue.enqueue_event = AsyncMock()

    await DeterministicAgentExecutor().execute(context, queue)

    payload: list[dict] = []
    for call in queue.enqueue_event.call_args_list:
        event = call.args[0]
        for part in _parts_from_event(event):
            if is_a2ui_part(part):
                payload.append(get_a2ui_datapart(part).data)
    return payload
