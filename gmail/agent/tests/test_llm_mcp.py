"""Offline assertions on the remote Gmail MCP wiring (task 2.6).

McpToolset connects lazily, so construction is offline; the one test that connects talks to
a local server standing in for Gmail's.

The tool filter is the ONLY thing keeping the destructive Gmail tools out of the model's
inventory — the credential authorizes them, because `gmail.modify` is the coarsest scope and
no narrower one grants labelling. So the admitted set is pinned here the way the GitHub agent
pins its read-only endpoint: changing it has to be a deliberate edit to a test, not a quiet
edit to a tuple.
"""

from __future__ import annotations

import pytest
from a2ui_agent_kit.sign_in import SignedInAccount, VendorSignInEnded
from a2ui_agent_kit.testing import serve_unauthorized
from a2ui_agent_kit.toolset import account_bearer

import app.mcp
from app.mcp import GMAIL_MCP_URL, GMAIL_TOOLS, build_gmail_toolset
from app.sign_in import GOOGLE_SCOPES

ACCOUNT = SignedInAccount(
    "sub-1", "g-1", {"email": "you@example.com"}, frozenset({"inbox"}),
    vendor_token={"access_token": "ya29.x"},
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


def test_the_write_scope_asks_google_for_modify():
    # gmail.modify covers drafts and labels alike; no narrower scope grants labelling.
    assert GOOGLE_SCOPES["organize"] == ["https://www.googleapis.com/auth/gmail.modify"]


def test_the_toolset_is_the_accounts_with_no_quota_project_header():
    toolset = build_gmail_toolset(ACCOUNT)
    assert toolset._connection_params.url == GMAIL_MCP_URL
    assert toolset._connection_params.headers == {"Authorization": "Bearer ya29.x"}
    assert toolset.header_provider is account_bearer


async def test_gmail_refusing_the_token_ends_the_accounts_sign_in(monkeypatch):
    async with serve_unauthorized() as url:
        monkeypatch.setattr(app.mcp, "GMAIL_MCP_URL", url)
        with pytest.raises(VendorSignInEnded):
            await build_gmail_toolset(ACCOUNT).get_tools()
