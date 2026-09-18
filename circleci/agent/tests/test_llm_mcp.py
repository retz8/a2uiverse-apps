"""Offline assertions on the hosted CircleCI MCP wiring (task-7.2 decisions 1 and 6).

No test here touches the network: McpToolset connects lazily, so construction is offline.

The tool filter is what keeps the server's other tools — the deploy subsystem with its
rollback, orbs, config validation, usage export — out of the model's inventory; the token
authorizes all of them. So the admitted set is pinned here: changing it has to be a
deliberate edit to a test, not a quiet edit to a tuple.
"""

from __future__ import annotations

import pytest

from app.mcp import (
    CIRCLECI_MCP_URL,
    CIRCLECI_TOOLS,
    TOKEN_ENV,
    MissingCircleciTokenError,
    circleci_connection_params,
    circleci_token,
    mcp_headers,
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


def test_the_token_is_not_the_name_the_cli_reads():
    # The CircleCI CLI reads CIRCLE_TOKEN implicitly; a stray value must not shadow ours.
    assert TOKEN_ENV == "CIRCLECI_MCP_TOKEN"


def test_the_token_is_sent_as_a_bearer_token():
    assert mcp_headers("t0k") == {"Authorization": "Bearer t0k"}


def test_missing_token_fails_fast_naming_the_alternative(monkeypatch):
    monkeypatch.delenv(TOKEN_ENV, raising=False)
    with pytest.raises(MissingCircleciTokenError) as excinfo:
        circleci_token()
    assert TOKEN_ENV in str(excinfo.value)
    assert "--mode stub" in str(excinfo.value)


def test_connection_params_carry_the_endpoint_and_the_header(monkeypatch):
    monkeypatch.setenv(TOKEN_ENV, "t0k")
    params = circleci_connection_params()
    assert params.url == CIRCLECI_MCP_URL
    assert params.headers == {"Authorization": "Bearer t0k"}
