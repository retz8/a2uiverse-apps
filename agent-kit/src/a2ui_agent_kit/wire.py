"""The A2A messages the kit reads and writes, on `a2a-sdk` 1.x's protobuf types.

A part's `data` and a message's `metadata` are protobuf `Value`s and `Struct`s, which hold every
number as a double. JSON draws no line between `42` and `42.0`, and the client that wrote them
sent a whole number, so the kit reads a whole double back as an `int`: an app's answer code and a
model's prompt see the values as the client sent them.
"""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from typing import Any

from a2a.helpers.proto_helpers import new_task
from a2a.server.tasks import TaskUpdater
from a2a.types import Message, Part, Role, TaskState
from google.protobuf import struct_pb2
from google.protobuf.json_format import MessageToDict, ParseDict
from google.protobuf.message import Message as ProtoMessage

MIME_TYPE_KEY = "mimeType"


def plain(value: Any) -> Any:
    """`value` as JSON would read it: a protobuf `Value`, `Struct` or `ListValue` made plain,
    whole doubles read back as `int`s."""
    if isinstance(value, ProtoMessage):
        value = MessageToDict(value)
    if isinstance(value, float) and value.is_integer():
        return int(value)
    if isinstance(value, dict):
        return {key: plain(item) for key, item in value.items()}
    if isinstance(value, list):
        return [plain(item) for item in value]
    return value


def part_data(part: Part) -> Any:
    """What a data part's `data` holds, made plain; None for any other part."""
    return plain(part.data) if part.HasField("data") else None


def part_text(part: Part) -> str | None:
    """A text part's text; None for any other part."""
    return part.text if part.HasField("text") else None


def part_mime_type(part: Part) -> str | None:
    """The mark a part carries in its metadata."""
    mime = plain(part.metadata).get(MIME_TYPE_KEY) if part.HasField("metadata") else None
    return mime if isinstance(mime, str) else None


def message_metadata(message: Message | None) -> dict:
    """A message's metadata, made plain; empty when it carries none."""
    if message is None or not message.HasField("metadata"):
        return {}
    return plain(message.metadata)


def first_text(message: Message | None) -> str | None:
    """The first non-empty text a message carries."""
    for part in message.parts if message is not None else ():
        if text := part_text(part):
            return text
    return None


def text_part(text: str) -> Part:
    return Part(text=text)


def data_part(data: Any, mime_type: str | None = None) -> Part:
    """A data part holding `data`; marked, with `mime_type` in its metadata's `mimeType` and in
    its own `media_type`."""
    part = Part(data=ParseDict(data, struct_pb2.Value()), media_type=mime_type or "")
    if mime_type:
        part.metadata.update({MIME_TYPE_KEY: mime_type})
    return part


def agent_message(parts: Sequence[Part], context_id: str, task_id: str) -> Message:
    """An agent's message in a task."""
    return Message(
        role=Role.ROLE_AGENT,
        message_id=str(uuid.uuid4()),
        context_id=context_id,
        task_id=task_id,
        parts=list(parts),
    )


async def open_task(context, event_queue) -> TaskUpdater:
    """The updater of the request's task, the task enqueued first when the request opens one."""
    if context.current_task is None:
        await event_queue.enqueue_event(
            new_task(
                context.task_id,
                context.context_id,
                TaskState.TASK_STATE_SUBMITTED,
                history=[context.message] if context.message is not None else [],
            )
        )
    return TaskUpdater(event_queue, context.task_id, context.context_id)
