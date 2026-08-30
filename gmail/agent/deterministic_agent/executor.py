"""Deterministic AgentExecutor: returns canned A2UI for the incoming action or text prompt."""

from __future__ import annotations

from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.server.tasks import TaskUpdater
from a2a.types import DataPart, Part, Task, TaskState, TextPart, UnsupportedOperationError
from a2a.utils import new_agent_parts_message, new_task
from a2a.utils.errors import ServerError
from a2ui.a2a.parts import create_a2ui_part

from deterministic_agent.responses import build_response, build_text_response


def _extract_action(context: RequestContext) -> dict | None:
    message = context.message
    if not message or not message.parts:
        return None
    for part in message.parts:
        root = part.root
        if isinstance(root, DataPart) and root.data.get("version") == "v0.9":
            action = root.data.get("action")
            if isinstance(action, dict):
                return action
    return None


def _extract_text(context: RequestContext) -> str | None:
    message = context.message
    if not message or not message.parts:
        return None
    for part in message.parts:
        root = part.root
        if isinstance(root, TextPart) and root.text:
            return root.text
    return None


class DeterministicAgentExecutor(AgentExecutor):
    """Returns a canned, catalog-conformant A2UI response on every action or text prompt."""

    async def execute(self, context: RequestContext, event_queue: EventQueue) -> None:
        action = _extract_action(context)
        if action is None and (text := _extract_text(context)) is not None:
            messages = build_text_response(text)
        else:
            # No parseable A2UI action or text -> unknown-event fallback.
            messages = build_response(action or {"name": "", "surfaceId": ""})
        parts: list[Part] = [create_a2ui_part(msg, version="v0.9") for msg in messages]

        task = context.current_task
        if not task:
            task = new_task(context.message)
            await event_queue.enqueue_event(task)

        updater = TaskUpdater(event_queue, task.id, task.context_id)
        await updater.update_status(
            TaskState.completed,
            new_agent_parts_message(parts, task.context_id, task.id),
            final=True,
        )

    async def cancel(self, context: RequestContext, event_queue: EventQueue) -> Task | None:
        raise ServerError(error=UnsupportedOperationError())
