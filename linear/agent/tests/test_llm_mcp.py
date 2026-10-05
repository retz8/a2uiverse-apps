"""Offline assertions on the hosted Linear MCP wiring (task-7.3 decisions 1, 6 and 11).

McpToolset connects lazily, so construction is offline; the one test that connects talks to
a local server standing in for Linear's.

The tool filter is what keeps the server's other tools — projects, cycles, documents,
initiatives, releases, Linear's pull-request review, the delete and label writes — out of the
model's inventory; the sign-in authorizes all of them. So the admitted set is pinned here: changing
it has to be a deliberate edit to a test, not a quiet edit to a tuple.
"""

from __future__ import annotations

import json

import httpx
import pytest

from a2ui_agent_kit.sign_in import SignedInAccount, VendorSignInEnded, bind_account, unbind_account
from a2ui_agent_kit.testing import serve_unauthorized
from a2ui_agent_kit.toolset import account_bearer

from app import mcp
from app.mcp import (
    LINEAR_MCP_URL,
    LINEAR_TOOLS,
    PLACEHOLDER_EMAIL,
    RecordingMcpTool,
    build_live_toolset,
    linear_connection_params,
    mcp_headers,
    replace_email,
)
from app.sign_in import SIGN_IN, _jsonrpc_message

ADDRESS = "someone@example.org"

ACCOUNT = SignedInAccount(
    "sub-1", "lin-1", {"email": ADDRESS}, frozenset({"issues.read"}),
    vendor_token={"access_token": "lin_oauth_x"},
)

# What the server exposes (live tools/list, 2026-09-18) that this agent does not hold.
WITHHELD = {
    "create_attachment",
    "create_attachment_from_upload",
    "create_issue_label",
    "delete_attachment",
    "delete_comment",
    "delete_diff_comment",
    "delete_status_update",
    "extract_images",
    "get_agent_skill",
    "get_attachment",
    "get_diff",
    "get_diff_threads",
    "get_document",
    "get_issue_status",
    "get_milestone",
    "get_notifications",
    "get_project",
    "get_release",
    "get_release_note",
    "get_status_updates",
    "get_team",
    "get_template",
    "get_workspace",
    "list_agent_skills",
    "list_cycles",
    "list_diffs",
    "list_documents",
    "list_milestones",
    "list_project_labels",
    "list_projects",
    "list_release_notes",
    "list_release_pipelines",
    "list_releases",
    "list_templates",
    "mark_notification",
    "merge_diff",
    "prepare_attachment_upload",
    "resolve_diff_thread",
    "restore_issue_label",
    "restore_project_label",
    "retire_issue_label",
    "retire_project_label",
    "save_diff_comment",
    "save_document",
    "save_issue_label",
    "save_milestone",
    "save_project",
    "save_project_label",
    "save_release",
    "save_release_note",
    "save_status_update",
    "search_documentation",
    "share_issue",
    "submit_diff_review",
    "unshare_issue",
    "update_diff",
}


def test_endpoint_is_the_hosted_server():
    assert LINEAR_MCP_URL == "https://mcp.linear.app/mcp"


def test_the_admitted_set_is_issues_and_their_two_writes():
    assert set(LINEAR_TOOLS) == {
        "list_issues",
        "get_issue",
        "list_comments",
        "list_teams",
        "list_issue_statuses",
        "list_issue_labels",
        "list_users",
        "get_user",
        "save_issue",
        "save_comment",
    }


def test_nothing_withheld_is_admitted():
    assert WITHHELD.isdisjoint(LINEAR_TOOLS)


def test_the_accounts_token_is_sent_as_a_bearer_token():
    assert mcp_headers("t0k") == {"Authorization": "Bearer t0k"}
    params = linear_connection_params(ACCOUNT)
    assert params.url == LINEAR_MCP_URL
    assert params.headers == {"Authorization": "Bearer lin_oauth_x"}
    assert build_live_toolset(ACCOUNT).header_provider is account_bearer


async def test_linear_refusing_the_token_ends_the_accounts_sign_in(monkeypatch):
    async with serve_unauthorized() as url:
        monkeypatch.setattr(mcp, "LINEAR_MCP_URL", url)
        with pytest.raises(VendorSignInEnded):
            await build_live_toolset(ACCOUNT).get_tools()


# The signed-in account's own email address in a recording (task-7.3 decision 11, task-12.10
# decision 10).


@pytest.fixture
def signed_in():
    from types import SimpleNamespace

    context = SimpleNamespace(call_context=SimpleNamespace(state={"auth": ACCOUNT}))
    token = bind_account(context, SIGN_IN)
    yield ACCOUNT
    unbind_account(token)


@pytest.fixture
def armed(monkeypatch, tmp_path, signed_in):
    monkeypatch.setenv("A2UI_RECORD_DIR", str(tmp_path))
    return tmp_path


def _result() -> dict:
    user = {"name": "Someone@Example.org", "email": ADDRESS, "displayName": "someone"}
    return {
        "content": [{"type": "text", "text": json.dumps(user)}],
        "structuredContent": user,
        "isError": False,
    }


def _tool(name: str) -> RecordingMcpTool:
    tool = object.__new__(RecordingMcpTool)
    tool.name = name
    return tool


def test_the_swap_reaches_both_copies_of_a_result_in_any_case():
    swapped = replace_email(_result(), ADDRESS)
    assert ADDRESS not in json.dumps(swapped).lower()
    assert swapped["structuredContent"]["email"] == PLACEHOLDER_EMAIL
    assert swapped["structuredContent"]["name"] == PLACEHOLDER_EMAIL
    assert json.loads(swapped["content"][0]["text"])["email"] == PLACEHOLDER_EMAIL
    assert swapped["structuredContent"]["displayName"] == "someone"


def test_record_mode_swaps_before_the_model_reads_and_captures_the_swapped_payload(armed):
    returned = _tool("get_user").shape_result(_result())
    assert ADDRESS not in json.dumps(returned).lower()
    captured = (armed / "payloads" / "get_user.jsonl").read_text(encoding="utf-8")
    assert ADDRESS not in captured.lower() and PLACEHOLDER_EMAIL in captured


def test_outside_record_mode_a_result_is_untouched(monkeypatch, signed_in):
    monkeypatch.delenv("A2UI_RECORD_DIR", raising=False)
    assert _tool("get_user").shape_result(_result()) == _result()


def test_a_streamed_answer_is_read_from_its_event():
    response = httpx.Response(200, text='event: message\ndata: {"jsonrpc": "2.0", "id": 2}\n\n')
    assert _jsonrpc_message(response) == {"jsonrpc": "2.0", "id": 2}
