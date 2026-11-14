"""The kit's task store: a task that ended stays ended.

A2A 0.3 §6.1: "A task which has reached a terminal state (completed, canceled, rejected, or
failed) can't be restarted." After a client closes its stream the SDK can keep reading the task
in the background while a `tasks/cancel` reads it a second time, so a `working` update the
first reader still had queued can land after the cancel's `canceled` (task-8.9 decision 4).

This store is the SDK's in-memory store, which keeps and hands out copies, and it never
replaces a task already in a terminal state.
"""

from __future__ import annotations

import logging

from a2a.server.context import ServerCallContext
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import Task, TaskState

logger = logging.getLogger(__name__)

TERMINAL_STATES = frozenset(
    {
        TaskState.TASK_STATE_COMPLETED,
        TaskState.TASK_STATE_CANCELED,
        TaskState.TASK_STATE_REJECTED,
        TaskState.TASK_STATE_FAILED,
    }
)


class TerminalGuardedTaskStore(InMemoryTaskStore):
    """In-memory task store that never lets a terminal task move on."""

    async def save(self, task: Task, context: ServerCallContext | None = None) -> None:
        context = context or ServerCallContext()
        stored = await self.get(task.id, context)
        if stored is not None and stored.status.state in TERMINAL_STATES:
            logger.debug(
                "task %s is already %s; dropped a later %s write",
                task.id,
                TaskState.Name(stored.status.state),
                TaskState.Name(task.status.state),
            )
            return
        await super().save(task, context)

    async def get(self, task_id: str, context: ServerCallContext | None = None) -> Task | None:
        return await super().get(task_id, context or ServerCallContext())

    async def delete(self, task_id: str, context: ServerCallContext | None = None) -> None:
        await super().delete(task_id, context or ServerCallContext())
