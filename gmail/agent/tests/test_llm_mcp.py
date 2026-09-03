"""Offline assertions on the remote Gmail MCP wiring (task 2.6).

No test here touches the network: McpToolset connects lazily, so construction is offline.

The tool filter is the ONLY thing keeping the destructive Gmail tools out of the model's
inventory — the credential authorizes them, because `gmail.modify` is the coarsest scope and
no narrower one grants labelling. So the admitted set is pinned here the way the GitHub agent
pins its read-only endpoint: changing it has to be a deliberate edit to a test, not a quiet
edit to a tuple.
"""

from __future__ import annotations

import pytest

from app.mcp import (
    GMAIL_MCP_URL,
    GMAIL_SCOPES,
    GMAIL_TOOLS,
    MissingGoogleCredentialError,
    quota_project,
)

# The eleven the server exposes that this agent deliberately does not hold.
WITHHELD = {
    "trash_message",
    "trash_thread",
    "untrash_message",
    "untrash_thread",
    "mark_message_spam",
    "mark_thread_spam",
    "unmark_message_spam",
    "unmark_thread_spam",
    "apply_sensitive_message_label",
    "apply_sensitive_thread_label",
    "update_message_labels",
}


def test_endpoint_is_the_documented_mcp_server():
    assert GMAIL_MCP_URL == "https://gmailmcp.googleapis.com/mcp/v1"


def test_no_destructive_tool_is_admitted():
    assert WITHHELD.isdisjoint(GMAIL_TOOLS)


def test_the_admitted_set_is_exactly_what_the_beats_need():
    assert set(GMAIL_TOOLS) == {
        "search_threads",
        "get_thread",
        "get_message",
        "list_labels",
        "list_drafts",
        "get_draft",
        "create_draft",
        "label_thread",
        "unlabel_thread",
        "label_message",
        "unlabel_message",
        "create_label",
    }


def test_no_send_tool_is_admitted():
    # The server exposes no send tool at all; this pins the agent's claim that it cannot
    # send, which the prompt states to the model as a hard rule.
    assert not any("send" in tool for tool in GMAIL_TOOLS)


def test_scopes_cover_both_write_tiers():
    # gmail.compose is the creating tier (create_draft); gmail.modify is the toggling tier
    # (label/unlabel). Dropping either silently disables half the agent at call time.
    assert "https://www.googleapis.com/auth/gmail.compose" in GMAIL_SCOPES
    assert "https://www.googleapis.com/auth/gmail.modify" in GMAIL_SCOPES


def test_missing_project_fails_fast_with_the_gmail_binding(monkeypatch):
    # The credential block itself is the kit's (a2ui_agent_kit.google_adc, tested there);
    # this pins the vendor binding — the error speaks as Gmail and names the alternative.
    monkeypatch.delenv("GOOGLE_CLOUD_PROJECT", raising=False)
    with pytest.raises(MissingGoogleCredentialError) as excinfo:
        quota_project()
    assert "Gmail" in str(excinfo.value)
    assert "--mode stub" in str(excinfo.value)
