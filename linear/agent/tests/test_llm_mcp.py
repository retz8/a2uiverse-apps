"""Offline assertions on the hosted Linear MCP wiring (task-7.3 decisions 1, 6 and 11).

No test here touches the network: McpToolset connects lazily, so construction is offline.

The tool filter is what keeps the server's other tools — projects, cycles, documents,
initiatives, releases, Linear's pull-request review, the delete and label writes — out of the
model's inventory; the key authorizes all of them. So the admitted set is pinned here: changing
it has to be a deliberate edit to a test, not a quiet edit to a tuple.
"""

from __future__ import annotations

import json

import httpx
import pytest

from app import mcp
from app.mcp import (
    LINEAR_MCP_URL,
    LINEAR_TOOLS,
    PLACEHOLDER_EMAIL,
    TOKEN_ENV,
    AccountEmailUnavailableError,
    MissingLinearTokenError,
    RecordingMcpTool,
    _jsonrpc_message,
    build_live_toolset,
    linear_connection_params,
    linear_token,
    mcp_headers,
    replace_email,
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


def test_the_key_is_sent_as_a_bearer_token():
    assert mcp_headers("t0k") == {"Authorization": "Bearer t0k"}


def test_missing_key_fails_fast_naming_the_alternative(monkeypatch):
    monkeypatch.delenv(TOKEN_ENV, raising=False)
    with pytest.raises(MissingLinearTokenError) as excinfo:
        linear_token()
    assert TOKEN_ENV in str(excinfo.value)
    assert "--mode stub" in str(excinfo.value)


def test_connection_params_carry_the_endpoint_and_the_header(monkeypatch):
    monkeypatch.setenv(TOKEN_ENV, "t0k")
    params = linear_connection_params()
    assert params.url == LINEAR_MCP_URL
    assert params.headers == {"Authorization": "Bearer t0k"}


# The key's own email address in a recording (task-7.3 decision 11).

ADDRESS = "someone@example.org"


@pytest.fixture
def armed(monkeypatch, tmp_path):
    monkeypatch.setenv("A2UI_RECORD_DIR", str(tmp_path))
    monkeypatch.setenv(TOKEN_ENV, "t0k")
    monkeypatch.setattr(RecordingMcpTool, "scrubbed_email", None)
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
    RecordingMcpTool.scrubbed_email = ADDRESS
    returned = _tool("get_user").shape_result(_result())
    assert ADDRESS not in json.dumps(returned).lower()
    captured = (armed / "payloads" / "get_user.jsonl").read_text(encoding="utf-8")
    assert ADDRESS not in captured.lower() and PLACEHOLDER_EMAIL in captured


def test_outside_record_mode_a_result_is_untouched(monkeypatch):
    monkeypatch.delenv("A2UI_RECORD_DIR", raising=False)
    monkeypatch.setattr(RecordingMcpTool, "scrubbed_email", ADDRESS)
    assert _tool("get_user").shape_result(_result()) == _result()


def test_a_recording_that_cannot_learn_the_address_does_not_start(armed, monkeypatch):
    def unavailable(token: str) -> str:
        raise AccountEmailUnavailableError("no email")

    monkeypatch.setattr(mcp, "account_email", unavailable)
    with pytest.raises(AccountEmailUnavailableError):
        build_live_toolset()


def test_arming_the_recorder_arms_the_swap(armed, monkeypatch):
    monkeypatch.setattr(mcp, "account_email", lambda token: ADDRESS)
    build_live_toolset()
    assert RecordingMcpTool.scrubbed_email == ADDRESS


def test_a_streamed_answer_is_read_from_its_event():
    response = httpx.Response(200, text='event: message\ndata: {"jsonrpc": "2.0", "id": 2}\n\n')
    assert _jsonrpc_message(response) == {"jsonrpc": "2.0", "id": 2}
