"""Live CircleCI MCP toolset: the hosted server, a pinned inventory, a personal API token.

The server exposes twenty-four tools under one endpoint: the pipeline chain (runs →
workflows → jobs → a job's logs), job diagnostics beyond logs, deploys, orbs, config
validation, and usage export. This agent is the pipeline chain and its two writes, so the
inventory is pinned client-side by `tool_filter` — see `CIRCLECI_TOOLS`. The pin is a
statement about what the agent is: it stays reviewable and diffable, and a tool the domain
doc never describes is a tool the model is never handed.

The credential is a CircleCI personal API token from `agent/.env`, sent as a bearer token.
It carries no scopes — the agent can do whatever the token's user can — so the brake on the
two writes is the interaction grammar (proposed, then confirmed), not the credential.

In record mode (`A2UI_RECORD_DIR` set) every tool result is captured as it returns, for the
stub corpus. Nothing is pseudonymized: the data is a public repository's CI.
"""

from __future__ import annotations

import os
from typing import Any

from google.adk.tools.mcp_tool import StreamableHTTPConnectionParams

from a2ui_agent_kit.corpus import capture_payload, corpus_payload, recording
from a2ui_agent_kit.toolset import PolicyMcpTool, PolicyMcpToolset

from app.projects import configured_projects, list_projects

__all__ = [
    "CIRCLECI_MCP_URL",
    "CIRCLECI_TOOLS",
    "TOKEN_ENV",
    "MissingCircleciTokenError",
    "build_live_toolset",
    "circleci_connection_params",
    "circleci_token",
    "mcp_headers",
]

CIRCLECI_MCP_URL = "https://mcp.circleci.com/v1/mcp"

# Deliberately not CIRCLE_TOKEN: the CircleCI CLI reads that name implicitly, so a stray
# value could silently shadow this one.
TOKEN_ENV = "CIRCLECI_MCP_TOKEN"

# The pipeline chain and its two writes, by the server's own names (pinned from a live
# tools/list). Everything absent is absent deliberately.
CIRCLECI_TOOLS = (
    # reads — the chain, each level's id feeding the next
    "list_runs",
    "get_run",
    "list_run_workflows",
    "get_workflow",
    "list_workflow_jobs",
    "get_job",
    "get_job_logs",
    # writes — each proposed first and fired on the user's confirm
    "rerun_workflow",
    "cancel_workflow",
)

# Withheld: list_job_tests, list_job_artifacts, get_job_resource_usage (test results,
# artifacts and resource diagnostics are outside this app), the deploy tools including
# rollback_deploy_component, get_orb, get_orb_source, validate_config, download_usage_data,
# get_me. Expanding the list is described in agent/README.md.


class MissingCircleciTokenError(RuntimeError):
    """Raised when the live backend is selected with no token configured."""


def circleci_token() -> str:
    """Reads the token, failing fast rather than degrading to canned data.

    A silent fallback would render a convincing surface from stub fixtures with no signal
    that it is not live, so the stub is only ever a deliberate choice.
    """
    token = os.environ.get(TOKEN_ENV)
    if not token:
        raise MissingCircleciTokenError(
            f"{TOKEN_ENV} is not set. The live agent sends a CircleCI personal API token as "
            "a bearer token on every MCP call and acts as that token's user; set it in "
            "agent/.env. To run against canned fixture data instead, run with --mode stub."
        )
    return token


def mcp_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def circleci_connection_params() -> StreamableHTTPConnectionParams:
    """The endpoint and credential header, built where they are applied so tests can
    assert them directly."""
    return StreamableHTTPConnectionParams(
        url=CIRCLECI_MCP_URL, headers=mcp_headers(circleci_token())
    )


class RecordingMcpTool(PolicyMcpTool):
    """Captures each result for the stub corpus in record mode; changes nothing."""

    def shape_result(self, result: Any) -> Any:
        if recording() and isinstance(result, dict):
            capture_payload(self.name, corpus_payload(result))
        return result


class RecordingMcpToolset(PolicyMcpToolset):
    tool_class = RecordingMcpTool


def build_live_toolset() -> list[Any]:
    """The live backend: the pinned MCP toolset beside the configured-projects tool.

    Construction is offline — the toolset connects only when its tools are first listed —
    but both settings are read here, so a missing token or project list fails at startup.
    """
    configured_projects()
    toolset = RecordingMcpToolset(
        connection_params=circleci_connection_params(),
        tool_filter=list(CIRCLECI_TOOLS),
    )
    return [toolset, list_projects]
