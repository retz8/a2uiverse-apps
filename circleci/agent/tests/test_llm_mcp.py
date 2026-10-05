"""Offline assertions on the hosted CircleCI MCP wiring (task-7.2 decisions 1 and 6).

McpToolset connects lazily, so construction is offline; the one test that connects talks to
a local server standing in for CircleCI's.

The tool filter is what keeps the server's other tools — the deploy subsystem with its
rollback, orbs, config validation, usage export — out of the model's inventory; the sign-in
authorizes all of them. So the admitted set is pinned here: changing it has to be a
deliberate edit to a test, not a quiet edit to a tuple.
"""

from __future__ import annotations

import pytest
from a2ui_agent_kit.sign_in import SignedInAccount, VendorSignInEnded
from a2ui_agent_kit.testing import serve_unauthorized
from a2ui_agent_kit.toolset import account_bearer

from app import mcp
from app.mcp import (
    CIRCLECI_MCP_URL,
    CIRCLECI_TOOLS,
    build_live_toolset,
    circleci_connection_params,
    mcp_headers,
)

ACCOUNT = SignedInAccount(
    "sub-1", "c-1", {}, frozenset({"pipelines.read"}), vendor_token={"access_token": "t0k"}
)

# What the server exposes (live tools/list, 2026-09-18) that this agent does not hold.
WITHHELD = {
    "list_job_tests",
    "list_job_artifacts",
    "get_job_resource_usage",
    "list_deployments",
    "list_deploy_components",
    "list_deploy_environments",
    "list_deploy_component_versions",
    "get_deploy_component",
    "get_deploy_environment",
    "rollback_deploy_component",
    "get_orb",
    "get_orb_source",
    "validate_config",
    "download_usage_data",
    "get_me",
}


def test_endpoint_is_the_hosted_server():
    assert CIRCLECI_MCP_URL == "https://mcp.circleci.com/v1/mcp"


def test_the_admitted_set_is_the_pipeline_chain_and_its_two_writes():
    assert set(CIRCLECI_TOOLS) == {
        "list_runs",
        "get_run",
        "list_run_workflows",
        "get_workflow",
        "list_workflow_jobs",
        "get_job",
        "get_job_logs",
        "rerun_workflow",
        "cancel_workflow",
    }


def test_nothing_withheld_is_admitted():
    assert WITHHELD.isdisjoint(CIRCLECI_TOOLS)


def test_the_accounts_token_is_sent_as_a_bearer_token():
    assert mcp_headers("t0k") == {"Authorization": "Bearer t0k"}
    params = circleci_connection_params(ACCOUNT)
    assert params.url == CIRCLECI_MCP_URL
    assert params.headers == {"Authorization": "Bearer t0k"}
    toolset, _ = build_live_toolset(ACCOUNT)
    assert toolset.header_provider is account_bearer


async def test_circleci_refusing_the_token_ends_the_accounts_sign_in(monkeypatch):
    async with serve_unauthorized() as url:
        monkeypatch.setattr(mcp, "CIRCLECI_MCP_URL", url)
        toolset, _ = build_live_toolset(ACCOUNT)
        with pytest.raises(VendorSignInEnded):
            await toolset.get_tools()
