"""Live CircleCI MCP toolset: the hosted server, a pinned inventory, the signed-in account.

The server exposes twenty-four tools under one endpoint: the pipeline chain (runs →
workflows → jobs → a job's logs), job diagnostics beyond logs, deploys, orbs, config
validation, and usage export. This agent is the pipeline chain and its two writes, so the
inventory is pinned client-side by `tool_filter` — see `CIRCLECI_TOOLS`. The pin is a
statement about what the agent is: it stays reviewable and diffable, and a tool the domain
doc never describes is a tool the model is never handed.

The credential is the signed-in account's CircleCI token, held by the agent's sign-in
(task-12.10, `app/sign_in.py`): one toolset per account, its token read again on every call.
CircleCI's token carries no scopes; the agent's sign-in asks for the two writes the first time
the person makes one, and the interaction grammar (proposed, then confirmed) still brakes each.

In record mode (`A2UI_RECORD_DIR` set) every tool result is captured as it returns, for the
stub corpus. Nothing is pseudonymized: the data is a public repository's CI.
"""

from __future__ import annotations

from typing import Any

from google.adk.tools.mcp_tool import StreamableHTTPConnectionParams

from a2ui_agent_kit.corpus import capture_payload, corpus_payload, recording
from a2ui_agent_kit.sign_in import SignedInAccount
from a2ui_agent_kit.toolset import PolicyMcpTool, PolicyMcpToolset, account_bearer

from app.projects import list_projects

__all__ = [
    "CIRCLECI_MCP_URL",
    "CIRCLECI_TOOLS",
    "build_live_toolset",
    "circleci_connection_params",
    "mcp_headers",
]

CIRCLECI_MCP_URL = "https://mcp.circleci.com/v1/mcp"

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


def mcp_headers(access_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {access_token}"}


def circleci_connection_params(account: SignedInAccount) -> StreamableHTTPConnectionParams:
    """The endpoint and credential header, built where they are applied so tests can
    assert them directly."""
    return StreamableHTTPConnectionParams(
        url=CIRCLECI_MCP_URL, headers=mcp_headers(account.vendor_token["access_token"])
    )


class RecordingMcpTool(PolicyMcpTool):
    """Captures each result for the stub corpus in record mode; changes nothing."""

    def shape_result(self, result: Any) -> Any:
        if recording() and isinstance(result, dict):
            capture_payload(self.name, corpus_payload(result))
        return result


class RecordingMcpToolset(PolicyMcpToolset):
    tool_class = RecordingMcpTool


def build_live_toolset(account: SignedInAccount) -> list[Any]:
    """The live backend for one signed-in account: the pinned MCP toolset beside the tool
    listing the account's projects.

    Construction is offline — the toolset connects only when its tools are first listed.
    """
    toolset = RecordingMcpToolset(
        connection_params=circleci_connection_params(account),
        tool_filter=list(CIRCLECI_TOOLS),
        header_provider=account_bearer,
    )
    return [toolset, list_projects]
