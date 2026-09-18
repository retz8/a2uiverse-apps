"""Offline assertions on the hosted Linear MCP wiring (task-7.3 decisions 1 and 6).

No test here touches the network: McpToolset connects lazily, so construction is offline.

The tool filter is what keeps the server's other tools — projects, cycles, documents,
initiatives, releases, Linear's pull-request review, the delete and label writes — out of the
model's inventory; the key authorizes all of them. So the admitted set is pinned here: changing
it has to be a deliberate edit to a test, not a quiet edit to a tuple.
"""

from __future__ import annotations

import pytest

from app.mcp import (
    LINEAR_MCP_URL,
    LINEAR_TOOLS,
    TOKEN_ENV,
    MissingLinearTokenError,
    linear_connection_params,
    linear_token,
    mcp_headers,
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
