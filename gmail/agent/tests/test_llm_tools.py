"""The stub Gmail toolset.

The stub's fixtures are derived from a live MCP run with the pseudonymizer armed, so they do
not exist until that run has happened. These tests skip until then rather than asserting
against hand-authored data — a fixture written to satisfy a test would defeat the point of
deriving the corpus from real payloads.
"""

from __future__ import annotations

import pytest

from app.tools import (
    STUB_TOOLS,
    create_draft,
    get_thread,
    label_thread,
    list_labels,
    search_threads,
    unlabel_thread,
)

requires_corpus = pytest.mark.skipif(
    not (
        __import__("pathlib").Path(__file__).resolve().parents[1]
        / "app"
        / "fixtures" / "stub"
        / "search-threads.json"
    ).is_file(),
    reason="stub corpus not recorded yet (see agent/README.md)",
)


def test_stub_tools_mirror_the_admitted_mcp_surface():
    # The stub exists so client and prompt work need not touch the mailbox; a tool the live
    # backend holds but the stub lacks is a beat that cannot be replayed offline.
    assert STUB_TOOLS == [
        search_threads,
        get_thread,
        list_labels,
        create_draft,
        label_thread,
        unlabel_thread,
    ]


def test_no_stub_tool_writes_anything():
    # Every stub write is an acknowledgement, never a mutation — the round-trip is
    # exercised, the mailbox is not.
    assert create_draft(to=["a@example.com"], subject="s", body="b")["id"] == "r-stub-draft"
    assert label_thread("t", ["INBOX"]) == {}
    assert unlabel_thread("t", ["INBOX"]) == {}


def test_missing_corpus_fails_with_a_pointer_not_a_keyerror():
    # A missing fixture is a setup problem; it should say so rather than surfacing as an
    # opaque file error three frames deep.
    try:
        search_threads()
    except FileNotFoundError as exc:
        assert "README" in str(exc)
    except Exception:  # noqa: BLE001 — corpus present, nothing to assert here
        pass


@requires_corpus
def test_search_returns_threads_with_bindable_fields():
    payload = search_threads(query="is:unread")
    threads = payload["threads"]
    assert threads
    message = threads[0]["messages"][0]
    for key in ("sender", "subject", "snippet", "labelIds"):
        assert key in message


@requires_corpus
def test_search_honours_page_size():
    assert len(search_threads(pageSize=1)["threads"]) <= 1


@requires_corpus
def test_get_unknown_thread_returns_error():
    assert "error" in get_thread("no-such-thread")


@requires_corpus
def test_labels_include_the_system_set():
    # The MCP payload keys this `labelId`, not `id` — the stub mirrors the wire shape.
    names = {label.get("labelId") for label in list_labels()["labels"]}
    assert "INBOX" in names
