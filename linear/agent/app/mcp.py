"""Live Linear MCP toolset: the hosted server, a pinned inventory, the signed-in account.

The server exposes sixty-six tools under one endpoint: issues and their comments, projects,
milestones, cycles, documents, initiatives, releases, Linear's own pull-request review, and
notifications. This agent is issues — their lists, one issue's detail and comments, and the
two writes that create, update and comment on them — so the inventory is pinned client-side
by `tool_filter`; see `LINEAR_TOOLS`. The pin is a statement about what the agent is: it
stays reviewable and diffable, and a tool the domain doc never describes is a tool the model
is never handed.

The credential is the signed-in account's Linear token, held by the agent's sign-in
(task-12.10, `app/sign_in.py`): one toolset per account, its token read again on every call.
The first sign-in reads; the writes are asked for the first time the person makes one, and the
interaction grammar (proposed, then confirmed) still brakes each.

In record mode (`A2UI_RECORD_DIR` set) every tool result is captured as it returns, for the
stub corpus. Values stay real with two exceptions (task-7.3 decision 11): the signed-in
account's own email address and full name are each replaced with a placeholder in every result
before the model reads it — at the source, as Gmail pseudonymizes (task-2.6 decision 8), so the
captured payloads and the painted streams are both clean. The username, and the branch names
built on it, are left alone: they are what another vendor's branch matches.
"""

from __future__ import annotations

import os
import re
from typing import Any

from google.adk.tools.mcp_tool import StreamableHTTPConnectionParams

from a2ui_agent_kit.corpus import capture_payload, corpus_payload, recording
from a2ui_agent_kit.sign_in import SignedInAccount, current_account
from a2ui_agent_kit.toolset import PolicyMcpTool, PolicyMcpToolset, account_bearer

__all__ = [
    "LINEAR_MCP_URL",
    "LINEAR_TOOLS",
    "PLACEHOLDER_EMAIL",
    "PLACEHOLDER_NAME",
    "build_live_toolset",
    "linear_connection_params",
    "mcp_headers",
    "replace_identity",
]

# The hosted server, unless the environment names another address for it, such as a proxy in
# front of it. The sign-in's resource stays the hosted server (`app/sign_in.py`).
LINEAR_MCP_URL = os.environ.get("LINEAR_MCP_URL") or "https://mcp.linear.app/mcp"

# What the account's own email address and full name become in a recorded run.
PLACEHOLDER_EMAIL = "me@example.com"
PLACEHOLDER_NAME = "Alex Rivera"

# Issues and their two writes, by the server's own names (pinned from a live tools/list,
# 2026-09-18). Everything absent is absent deliberately.
LINEAR_TOOLS = (
    # reads — issues, one issue's comments, and the team vocabulary an issue is written in
    "list_issues",
    "get_issue",
    "list_comments",
    "list_teams",
    "list_issue_statuses",
    "list_issue_labels",
    "list_users",
    "get_user",
    # writes — each proposed first and fired on the user's confirm
    "save_issue",
    "save_comment",
)

# Withheld: delete_comment, the label writes (create_issue_label, save_issue_label,
# retire_/restore_issue_label), the attachment tools (get_attachment and its four writes),
# share_issue / unshare_issue, get_team, get_issue_status, and every tool over projects,
# milestones, cycles, documents, initiatives, releases, templates, status updates, Linear's
# pull-request review (the *_diff* tools), notifications, agent skills, the workspace and
# Linear's documentation. Expanding the list is described in agent/README.md.


def mcp_headers(access_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {access_token}"}


def linear_connection_params(account: SignedInAccount) -> StreamableHTTPConnectionParams:
    """The endpoint and credential header, built where they are applied so tests can
    assert them directly."""
    return StreamableHTTPConnectionParams(
        url=LINEAR_MCP_URL, headers=mcp_headers(account.vendor_token["access_token"])
    )


def replace_identity(value: Any, email: str | None, name: str | None) -> Any:
    """Every occurrence of `email` and of `name`, in any case, replaced with its placeholder —
    through dicts, lists and strings alike, so a result's `content` text and its
    `structuredContent` both. The email goes first: a name Linear wrote as the address is gone
    with it."""
    swaps = [
        (re.compile(re.escape(own), re.IGNORECASE), placeholder)
        for own, placeholder in ((email, PLACEHOLDER_EMAIL), (name, PLACEHOLDER_NAME))
        if own
    ]

    def walk(node: Any) -> Any:
        if isinstance(node, str):
            for pattern, placeholder in swaps:
                node = pattern.sub(placeholder, node)
            return node
        if isinstance(node, list):
            return [walk(item) for item in node]
        if isinstance(node, dict):
            return {key: walk(item) for key, item in node.items()}
        return node

    return walk(value)


class RecordingMcpTool(PolicyMcpTool):
    """In record mode, replaces the signed-in account's own email address and full name in each
    result, then captures it.

    The replaced result is what the model reads, so nothing downstream holds either. A
    comment list names no issue, so its capture carries the `issueId` it was read for — the key
    the stub serves it back under.
    """

    _issue: str | None = None

    def shape_args(self, args: dict[str, Any]) -> dict[str, Any]:
        self._issue = args.get("issueId") if self.name == "list_comments" else None
        return args

    def shape_result(self, result: Any) -> Any:
        if not (recording() and isinstance(result, dict)):
            return result
        if account := current_account():
            result = replace_identity(result, account.claims.get("email"), account.claims.get("name"))
        payload = corpus_payload(result)
        if self._issue and isinstance(payload, dict):
            payload = {"issueId": self._issue, **payload}
        capture_payload(self.name, payload)
        return result


class RecordingMcpToolset(PolicyMcpToolset):
    tool_class = RecordingMcpTool


def build_live_toolset(account: SignedInAccount) -> RecordingMcpToolset:
    """The live backend for one signed-in account: the pinned MCP toolset.

    Construction is offline — the toolset connects only when its tools are first listed.
    """
    return RecordingMcpToolset(
        connection_params=linear_connection_params(account),
        tool_filter=list(LINEAR_TOOLS),
        header_provider=account_bearer,
    )
