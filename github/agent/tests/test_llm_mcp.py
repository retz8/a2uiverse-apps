"""Offline assertions on the remote GitHub MCP wiring (task 7.3).

No test here touches the network: McpToolset connects lazily, so construction is
safe, and every other assertion is over constants and header assembly.
"""

import pytest
from google.adk.tools.mcp_tool import McpToolset

from app.mcp import (
    GITHUB_MCP_TOOLSETS,
    GITHUB_MCP_URL,
    PAT_ENV_VAR,
    MissingGitHubPatError,
    build_github_toolset,
    github_connection_params,
    github_pat,
    mcp_headers,
)


def test_endpoint_is_the_read_only_variant():
    # Read-only layer 1: write tools never enter the inventory. Dropping the
    # /readonly suffix would hand the model merge_pull_request and
    # pull_request_review_write.
    assert GITHUB_MCP_URL == "https://api.githubcopilot.com/mcp/readonly"


def test_toolsets_are_pinned_exactly():
    # Pinned, not inherited from the server default and not "all": the tool
    # surface is a design decision, so it stays diffable.
    assert GITHUB_MCP_TOOLSETS == (
        "context",
        "repos",
        "issues",
        "pull_requests",
        "users",
        "notifications",
    )


def test_pat_env_var_is_dedicated():
    # Deliberately not GITHUB_TOKEN, which CI and the gh CLI inject implicitly.
    assert PAT_ENV_VAR == "GITHUB_MCP_PAT"


def test_github_pat_reads_env(monkeypatch):
    monkeypatch.setenv(PAT_ENV_VAR, "ghp_example")
    assert github_pat() == "ghp_example"


def test_github_pat_missing_fails_fast_naming_both_knobs(monkeypatch):
    monkeypatch.delenv(PAT_ENV_VAR, raising=False)
    with pytest.raises(MissingGitHubPatError) as excinfo:
        github_pat()
    message = str(excinfo.value)
    assert PAT_ENV_VAR in message
    assert "TOOL_BACKEND=stub" in message


def test_github_pat_empty_is_treated_as_missing(monkeypatch):
    monkeypatch.setenv(PAT_ENV_VAR, "")
    with pytest.raises(MissingGitHubPatError):
        github_pat()


def test_headers_carry_bearer_and_pinned_toolsets():
    headers = mcp_headers("ghp_example")
    assert headers["Authorization"] == "Bearer ghp_example"
    assert headers["X-MCP-Toolsets"] == (
        "context,repos,issues,pull_requests,users,notifications"
    )


def test_connection_params_use_the_readonly_url_and_pinned_headers(monkeypatch):
    # This is the point where the constants are actually applied: pinning
    # GITHUB_MCP_URL/GITHUB_MCP_TOOLSETS alone proves nothing if
    # build_github_toolset can construct its params some other way.
    monkeypatch.setenv(PAT_ENV_VAR, "ghp_example")
    params = github_connection_params()
    assert params.url == GITHUB_MCP_URL
    assert params.headers == mcp_headers("ghp_example")


def test_build_toolset_constructs_offline(monkeypatch):
    monkeypatch.setenv(PAT_ENV_VAR, "ghp_example")
    toolset = build_github_toolset()
    assert isinstance(toolset, McpToolset)


def test_build_toolset_without_pat_fails_fast(monkeypatch):
    monkeypatch.delenv(PAT_ENV_VAR, raising=False)
    with pytest.raises(MissingGitHubPatError):
        build_github_toolset()
