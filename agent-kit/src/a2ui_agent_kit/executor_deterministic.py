"""Deterministic AgentExecutor: returns canned A2UI for the incoming action or text prompt.

The response content comes from the app: the executor is constructed with the config's
(build_response, build_text_response) pair and owns only the A2A mechanics around them. A
canned `paintMeta` rides as the shell part the live executor emits, ahead of every A2UI part,
so the paint it names is titled and a question is marked (task-10.9 decision 8).
"""

from __future__ import annotations

from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.server.tasks import TaskUpdater
from a2a.types import DataPart, Part, Task, TaskState, TextPart
from a2a.utils import new_agent_parts_message, new_task
from a2ui.a2a.parts import create_a2ui_part

from a2ui_agent_kit.config import BuildResponse, BuildTextResponse
from a2ui_agent_kit.paint_meta import create_paint_meta_part
from a2ui_agent_kit.sign_in import (
    AuthRequired,
    SignIn,
    auth_required_message,
    bind_account,
    require_action_scopes,
    unbind_account,
)
from a2ui_agent_kit.versions import WIRE_VERSION


def _extract_action(context: RequestContext) -> dict | None:
    message = context.message
    if not message or not message.parts:
        return None
    for part in message.parts:
        root = part.root
        if isinstance(root, DataPart) and root.data.get("version") == WIRE_VERSION:
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

    def __init__(
        self,
        build_response: BuildResponse,
        build_text_response: BuildTextResponse,
        sign_in: SignIn | None = None,
    ):
        self._build_response = build_response
        self._build_text_response = build_text_response
        self._sign_in = sign_in

    async def execute(self, context: RequestContext, event_queue: EventQueue) -> None:
        # The request's signed-in account, readable by the app's answer code through
        # `current_account()` for this run.
        bound = bind_account(context, self._sign_in)
        try:
            await self._execute(context, event_queue)
        finally:
            unbind_account(bound)

    async def _execute(self, context: RequestContext, event_queue: EventQueue) -> None:
        action = _extract_action(context)
        try:
            if action is None and (text := _extract_text(context)) is not None:
                messages = self._build_text_response(text)
            else:
                # An action needing a scope the token lacks ends the run asking for it.
                require_action_scopes((action or {}).get("name"))
                # No parseable A2UI action or text -> unknown-event fallback.
                messages = self._build_response(action or {"name": "", "surfaceId": ""})
        except AuthRequired as err:
            await self._auth_required(context, event_queue, err)
            return
        parts: list[Part] = [
            *(create_paint_meta_part(msg["paintMeta"]) for msg in messages if "paintMeta" in msg),
            *(
                create_a2ui_part(msg, version=WIRE_VERSION)
                for msg in messages
                if "paintMeta" not in msg
            ),
        ]

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

    async def _auth_required(
        self, context: RequestContext, event_queue: EventQueue, err: AuthRequired
    ) -> None:
        task = context.current_task
        if not task:
            task = new_task(context.message)
            await event_queue.enqueue_event(task)
        await TaskUpdater(event_queue, task.id, task.context_id).update_status(
            TaskState.auth_required,
            auth_required_message(err, task.context_id, task.id),
            final=True,
        )

    async def cancel(self, context: RequestContext, event_queue: EventQueue) -> Task | None:
        # Nothing of its own to stop: a turn is one completed final, and the SDK answers
        # a task that already ended not cancelable without calling here. A cancel that
        # lands before that final is answered with a bare `canceled` (task-8.9 decision 3).
        await TaskUpdater(event_queue, context.task_id, context.context_id).cancel()
        return None
