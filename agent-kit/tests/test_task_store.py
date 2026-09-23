"""L0 task-store tests: a task that ended stays ended, and readers never share the stored task."""

import pytest
from a2a.server.tasks import TaskManager
from a2a.types import Task, TaskState, TaskStatus, TaskStatusUpdateEvent

from a2ui_agent_kit.task_store import TERMINAL_STATES, TerminalGuardedTaskStore


def _task(state: TaskState, task_id: str = "t1") -> Task:
    return Task(id=task_id, context_id="c1", status=TaskStatus(state=state))


@pytest.mark.asyncio
async def test_a_running_task_moves_on():
    store = TerminalGuardedTaskStore()
    await store.save(_task(TaskState.submitted))
    await store.save(_task(TaskState.working))
    await store.save(_task(TaskState.completed))
    assert (await store.get("t1")).status.state == TaskState.completed


@pytest.mark.asyncio
@pytest.mark.parametrize("terminal", sorted(TERMINAL_STATES, key=lambda s: s.value))
async def test_a_terminal_task_is_never_replaced(terminal):
    # A2A 0.3 §6.1: a task in a terminal state can't be restarted.
    store = TerminalGuardedTaskStore()
    await store.save(_task(TaskState.working))
    await store.save(_task(terminal))
    await store.save(_task(TaskState.working))
    await store.save(_task(TaskState.completed))
    assert (await store.get("t1")).status.state == terminal


def test_the_terminal_states_are_a2a_s_four():
    assert TERMINAL_STATES == {
        TaskState.completed,
        TaskState.canceled,
        TaskState.rejected,
        TaskState.failed,
    }


@pytest.mark.asyncio
async def test_a_reader_changing_its_task_in_place_leaves_the_stored_one_alone():
    # The SDK's task readers update the task they hold in place; with a shared object
    # a stale reader's `working` would reach the store without ever calling save.
    store = TerminalGuardedTaskStore()
    saved = _task(TaskState.canceled)
    await store.save(saved)
    saved.status = TaskStatus(state=TaskState.working)
    read = await store.get("t1")
    read.status = TaskStatus(state=TaskState.working)
    assert (await store.get("t1")).status.state == TaskState.canceled


def _update(state: TaskState, final: bool = False) -> TaskStatusUpdateEvent:
    return TaskStatusUpdateEvent(
        task_id="t1", context_id="c1", status=TaskStatus(state=state), final=final
    )


@pytest.mark.asyncio
async def test_the_sdk_s_stream_reader_cannot_move_a_cancelled_task_on():
    # The SDK's cancel sequence, reader by reader: the closed stream's background reader
    # has read the task; the cancel's reader writes `canceled`; then the stream reader
    # works through an update it still held. On the SDK's InMemoryTaskStore the task
    # ends `working`.
    store = TerminalGuardedTaskStore()
    stream_reader = TaskManager(task_id=None, context_id=None, task_store=store, initial_message=None)
    await stream_reader.process(_task(TaskState.submitted))
    await stream_reader.process(_update(TaskState.working))
    cancel_reader = TaskManager(task_id="t1", context_id="c1", task_store=store, initial_message=None)
    await cancel_reader.process(_update(TaskState.canceled, final=True))
    await stream_reader.process(_update(TaskState.working))
    assert (await store.get("t1")).status.state == TaskState.canceled


@pytest.mark.asyncio
async def test_an_unknown_task_reads_none_and_a_deleted_one_is_gone():
    store = TerminalGuardedTaskStore()
    assert await store.get("nope") is None
    await store.save(_task(TaskState.completed))
    await store.delete("t1")
    assert await store.get("t1") is None
    await store.delete("t1")  # deleting twice is harmless
