"""In-process test harness: run an executor and reconstruct its emitted A2UI payload.

Shipped in the package (not the kit's tests/) so vendor suites import one harness
instead of carrying byte-identical copies. The executor is injected: the kit's own
suite builds one from a fake config's response pair; a vendor suite builds one
from its app's.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.types import DataPart, Message, Part, Role, TextPart
from a2ui.a2a.parts import get_a2ui_datapart, is_a2ui_part

from a2ui_agent_kit.versions import WIRE_VERSION


def _incoming_message(action: dict) -> Message:
    return Message(
        message_id="test-msg",
        role=Role.user,
        parts=[Part(root=DataPart(data={"version": WIRE_VERSION, "action": action}))],
        kind="message",
    )


def _incoming_text_message(text: str) -> Message:
    return Message(
        message_id="test-msg",
        role=Role.user,
        parts=[Part(root=TextPart(text=text))],
        kind="message",
    )


def _parts_from_event(event) -> list:
    status = getattr(event, "status", None)
    message = getattr(status, "message", None) if status is not None else None
    return list(getattr(message, "parts", []) or [])


async def _run(executor: AgentExecutor, message: Message) -> list[dict]:
    context = MagicMock(spec=RequestContext)
    context.message = message
    context.current_task = None

    queue = MagicMock(spec=EventQueue)
    queue.enqueue_event = AsyncMock()

    await executor.execute(context, queue)

    payload: list[dict] = []
    for call in queue.enqueue_event.call_args_list:
        event = call.args[0]
        for part in _parts_from_event(event):
            if is_a2ui_part(part):
                payload.append(get_a2ui_datapart(part).data)
    return payload


async def run_executor(executor: AgentExecutor, action: dict) -> list[dict]:
    return await _run(executor, _incoming_message(action))


async def run_executor_text(executor: AgentExecutor, text: str) -> list[dict]:
    return await _run(executor, _incoming_text_message(text))
