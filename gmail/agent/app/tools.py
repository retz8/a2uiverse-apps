"""Stub Gmail toolset: canned, real-shaped mailbox data.

A mirror of the Gmail read/write surface the beats need, over fixtures captured from live
MCP with the pseudonymizer armed (task-2.6 decision 11) — so the canned data is derived
from real payloads rather than invented, and carries no real mail.

The stub exists so client work, prompt iteration and beat replay need not touch the
mailbox or consume MCP call allowance. It is always an explicit opt-in (`--mode stub`).

Writes are accepted and acknowledged but change nothing: a stub `create_draft` returns a
draft id without a draft existing. That is the point — the round-trip is exercised, the
mailbox is not.
"""

from __future__ import annotations

from pathlib import Path

from a2ui_agent_kit.responses import stub_fixture_loader

_FIXTURES = Path(__file__).resolve().parent / "fixtures" / "stub"

_fixture = stub_fixture_loader(
    _FIXTURES,
    hint=(
        "The stub corpus is derived from a live MCP run with the recorder armed; "
        "see agent/README.md."
    ),
)


def search_threads(query: str = "", pageSize: int = 20) -> dict:  # noqa: N803 - MCP arg name
    """Searches mail threads.

    Args:
        query: A Gmail search query, e.g. "is:unread" or "from:someone@example.com".
        pageSize: Maximum threads to return. Defaults to 20.

    Returns:
        An object with a `threads` list; each thread carries its id and its messages'
        metadata (sender, subject, snippet, date, labelIds).
    """
    payload = _fixture("search-threads")
    threads = payload.get("threads", [])
    return {**payload, "threads": threads[:pageSize]}


def get_thread(threadId: str) -> dict:  # noqa: N803 - MCP arg name
    """Gets one thread and its messages by id.

    Args:
        threadId: The thread's id.

    Returns:
        The thread with its messages. Returns an object with an "error" key if unknown.
    """
    threads = _fixture("get-thread")
    thread = threads.get(threadId)
    if thread is None:
        return {"error": f"thread {threadId} not found"}
    return thread


def list_labels() -> dict:
    """Lists the mailbox's labels.

    Returns:
        An object with a `labels` list of {id, name, type}.
    """
    return _fixture("list-labels")


def create_draft(
    to: list[str] | None = None,
    subject: str = "",
    body: str = "",
    replyToMessageId: str = "",  # noqa: N803 - MCP arg name
) -> dict:
    """Creates a draft reply. In the stub backend nothing is written.

    Args:
        to: Recipient addresses.
        subject: The subject line.
        body: The plain-text body.
        replyToMessageId: The message this drafts a reply to, if any.

    Returns:
        A Draft object with `id` and `threadId`.
    """
    return {"id": "r-stub-draft", "threadId": replyToMessageId or "stub-thread"}


def label_thread(threadId: str, labelIds: list[str]) -> dict:  # noqa: N803 - MCP arg names
    """Adds labels to a thread. In the stub backend nothing is written.

    Args:
        threadId: The thread to label.
        labelIds: The label ids to add.

    Returns:
        An empty object on success.
    """
    return {}


def unlabel_thread(threadId: str, labelIds: list[str]) -> dict:  # noqa: N803 - MCP arg names
    """Removes labels from a thread. In the stub backend nothing is written.

    Args:
        threadId: The thread to unlabel.
        labelIds: The label ids to remove.

    Returns:
        An empty object on success.
    """
    return {}


STUB_TOOLS = [
    search_threads,
    get_thread,
    list_labels,
    create_draft,
    label_thread,
    unlabel_thread,
]
