"""The kit's task store: a task that ended stays ended.

A2A 0.3 §6.1: "A task which has reached a terminal state (completed, canceled,
rejected, or failed) can't be restarted." The SDK's `InMemoryTaskStore` does not hold
that line under `tasks/cancel`. It hands every reader the very object it holds, and the
SDK's task readers update that object in place; after a client closes its stream the
SDK keeps reading the task in the background, and the cancel reads it a second time.
A `working` update the first reader still had queued lands after the cancel's
`canceled`, and the task reads `working` from then on (task-8.9 decision 4).

This store keeps its own copy of every task, hands out copies, and never replaces a
task already in a terminal state. The SDK's 1.x line reads each task through one
reader; the store can go at the A2A 1.0 migration.
"""

from __future__ import annotations

import asyncio
import logging

from a2a.server.context import ServerCallContext
from a2a.server.tasks import TaskStore
from a2a.types import Task, TaskState

logger = logging.getLogger(__name__)

TERMINAL_STATES = frozenset(
    {TaskState.completed, TaskState.canceled, TaskState.rejected, TaskState.failed}
)


class TerminalGuardedTaskStore(TaskStore):
    """In-memory task store that never lets a terminal task move on."""

    def __init__(self) -> None:
        self._tasks: dict[str, Task] = {}
        self._lock = asyncio.Lock()

    async def save(self, task: Task, context: ServerCallContext | None = None) -> None:
        async with self._lock:
            stored = self._tasks.get(task.id)
            if stored is not None and stored.status.state in TERMINAL_STATES:
                logger.debug(
                    "task %s is already %s; dropped a later %s write",
                    task.id,
                    stored.status.state.value,
                    task.status.state.value,
                )
                return
            self._tasks[task.id] = task.model_copy(deep=True)

    async def get(
        self, task_id: str, context: ServerCallContext | None = None
    ) -> Task | None:
        async with self._lock:
            task = self._tasks.get(task_id)
            return task.model_copy(deep=True) if task is not None else None

    async def delete(self, task_id: str, context: ServerCallContext | None = None) -> None:
        async with self._lock:
            self._tasks.pop(task_id, None)
