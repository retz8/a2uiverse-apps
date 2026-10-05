"""Offline assertions on the remote GitHub MCP wiring (task 7.3), per signed-in account
(task 12.10).

McpToolset connects lazily, so construction is safe; the one test that connects talks
to a local server standing in for GitHub's.
"""

import pytest
from a2ui_agent_kit.sign_in import SignedInAccount, VendorSignInEnded
from a2ui_agent_kit.testing import serve_unauthorized
from a2ui_agent_kit.toolset import PolicyMcpTool, PolicyMcpToolset, account_bearer
from google.adk.tools.mcp_tool import McpToolset

import app.mcp
from app.mcp import (
    GITHUB_MCP_TOOLSETS,
    GITHUB_MCP_URL,
    build_github_toolset,
    github_connection_params,
    mcp_headers,
)

ACCOUNT = SignedInAccount(
    "sub-1", "1", {"preferred_username": "octo"}, frozenset({"github.read"}),
    vendor_token={"access_token": "gho_example"},
)


def test_endpoint_is_the_unrestricted_server():
    # Task-3.7 decision 1: the agent is another GitHub client acting as the
    # user — capability is whatever MCP + the sign-in allow. The /readonly variant
    # retired with the write tier.
    assert GITHUB_MCP_URL == "https://api.githubcopilot.com/mcp/"


def test_toolset_header_is_an_explicit_all():
    # Explicit rather than omitted: no header means the server's DEFAULT subset
    # (which loses the notification tools among others), not the full surface.
    assert GITHUB_MCP_TOOLSETS == "all"


def test_headers_carry_bearer_and_the_all_toolsets_header():
    headers = mcp_headers("gho_example")
    assert headers["Authorization"] == "Bearer gho_example"
    assert headers["X-MCP-Toolsets"] == "all"


def test_connection_params_carry_the_accounts_github_token():
    params = github_connection_params(ACCOUNT)
    assert params.url == GITHUB_MCP_URL
    assert params.headers == mcp_headers("gho_example")


def test_the_toolset_is_the_accounts_and_reads_its_token_per_call():
    # The kit's policy toolset with its no-op hooks (task-3.3 decision 1); the token
    # is read again on every call, so a refreshed one is used at once.
    toolset = build_github_toolset(ACCOUNT)
    assert isinstance(toolset, McpToolset)
    assert isinstance(toolset, PolicyMcpToolset)
    assert toolset.tool_class is PolicyMcpTool
    assert toolset.header_provider is account_bearer


async def test_github_refusing_the_token_ends_the_accounts_sign_in(monkeypatch):
    async with serve_unauthorized() as url:
        monkeypatch.setattr(app.mcp, "GITHUB_MCP_URL", url)
        with pytest.raises(VendorSignInEnded):
            await build_github_toolset(ACCOUNT).get_tools()
