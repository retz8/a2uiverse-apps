"""Live Linear MCP toolset: the hosted server, a pinned inventory, a personal API key.

The server exposes sixty-six tools under one endpoint: issues and their comments, projects,
milestones, cycles, documents, initiatives, releases, Linear's own pull-request review, and
notifications. This agent is issues — their lists, one issue's detail and comments, and the
two writes that create, update and comment on them — so the inventory is pinned client-side
by `tool_filter`; see `LINEAR_TOOLS`. The pin is a statement about what the agent is: it
stays reviewable and diffable, and a tool the domain doc never describes is a tool the model
is never handed.

The credential is a Linear personal API key from `agent/.env`, sent as a bearer token. The
key carries the Read and Write permissions; the agent can do whatever the key's user can
within them, so the brake on the writes is the interaction grammar (proposed, then
confirmed), not the credential.

In record mode (`A2UI_RECORD_DIR` set) every tool result is captured as it returns, for the
stub corpus. Values stay real with one exception (task-7.3 decision 11): the key's own email
address, asked of the server once when the recorder arms, is replaced with a placeholder in every
result before the model reads it — at the source, as Gmail pseudonymizes (task-2.6 decision 8),
so the captured payloads and the painted streams are both clean. The username, and the branch
names built on it, are left alone: they are what another vendor's branch matches.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, ClassVar

import httpx
from google.adk.tools.mcp_tool import StreamableHTTPConnectionParams

from a2ui_agent_kit.corpus import capture_payload, corpus_payload, recording
from a2ui_agent_kit.toolset import PolicyMcpTool, PolicyMcpToolset

__all__ = [
    "LINEAR_MCP_URL",
    "LINEAR_TOOLS",
    "PLACEHOLDER_EMAIL",
    "TOKEN_ENV",
    "AccountEmailUnavailableError",
    "MissingLinearTokenError",
    "account_email",
    "build_live_toolset",
    "linear_connection_params",
    "linear_token",
    "mcp_headers",
    "replace_email",
]

LINEAR_MCP_URL = "https://mcp.linear.app/mcp"

TOKEN_ENV = "LINEAR_MCP_TOKEN"

# What the key's own email address becomes in a recorded run.
PLACEHOLDER_EMAIL = "me@example.com"

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


class MissingLinearTokenError(RuntimeError):
    """Raised when the live backend is selected with no key configured."""


def linear_token() -> str:
    """Reads the key, failing fast rather than degrading to canned data.

    A silent fallback would render a convincing surface from stub fixtures with no signal
    that it is not live, so the stub is only ever a deliberate choice.
    """
    token = os.environ.get(TOKEN_ENV)
    if not token:
        raise MissingLinearTokenError(
            f"{TOKEN_ENV} is not set. The live agent sends a Linear personal API key as a "
            "bearer token on every MCP call and acts as that key's user; set it in "
            "agent/.env. To run against canned fixture data instead, run with --mode stub."
        )
    return token


def mcp_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def linear_connection_params() -> StreamableHTTPConnectionParams:
    """The endpoint and credential header, built where they are applied so tests can
    assert them directly."""
    return StreamableHTTPConnectionParams(url=LINEAR_MCP_URL, headers=mcp_headers(linear_token()))


class AccountEmailUnavailableError(RuntimeError):
    """Raised when record mode cannot learn the address it must replace."""


def _jsonrpc_message(response: httpx.Response) -> dict[str, Any]:
    """The JSON-RPC message of a streamable-HTTP response, sent as JSON or as one SSE event."""
    text = response.text
    for line in text.splitlines():
        if line.startswith("data: "):
            return json.loads(line[len("data: ") :])
    return json.loads(text)


def account_email(token: str) -> str:
    """The key's own email address, asked of the hosted server as `get_user("me")`.

    Called once, when the recorder arms: it is the one value a recording replaces, so a
    recording that cannot learn it does not start.
    """
    headers = {
        **mcp_headers(token),
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-06-18",
    }
    try:
        with httpx.Client(timeout=30) as client:
            init = client.post(
                LINEAR_MCP_URL,
                headers=headers,
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "initialize",
                    "params": {
                        "protocolVersion": "2025-06-18",
                        "capabilities": {},
                        "clientInfo": {"name": "a2uiverse-linear-recorder", "version": "0"},
                    },
                },
            )
            init.raise_for_status()
            if session := init.headers.get("mcp-session-id"):
                headers["Mcp-Session-Id"] = session
            client.post(
                LINEAR_MCP_URL,
                headers=headers,
                json={"jsonrpc": "2.0", "method": "notifications/initialized"},
            )
            response = client.post(
                LINEAR_MCP_URL,
                headers=headers,
                json={
                    "jsonrpc": "2.0",
                    "id": 2,
                    "method": "tools/call",
                    "params": {"name": "get_user", "arguments": {"query": "me"}},
                },
            )
            response.raise_for_status()
        user = corpus_payload(_jsonrpc_message(response).get("result") or {})
    except (httpx.HTTPError, ValueError) as exc:
        raise AccountEmailUnavailableError(
            f"record mode could not read the key's own email address from Linear: {exc}"
        ) from exc
    email = user.get("email") if isinstance(user, dict) else None
    if not isinstance(email, str) or "@" not in email:
        raise AccountEmailUnavailableError(
            "record mode could not read the key's own email address from Linear: get_user(\"me\") "
            "returned no email."
        )
    return email


def replace_email(value: Any, email: str) -> Any:
    """Every occurrence of `email`, in any case, replaced with the placeholder — through dicts,
    lists and strings alike, so a result's `content` text and its `structuredContent` both."""
    pattern = re.compile(re.escape(email), re.IGNORECASE)

    def walk(node: Any) -> Any:
        if isinstance(node, str):
            return pattern.sub(PLACEHOLDER_EMAIL, node)
        if isinstance(node, list):
            return [walk(item) for item in node]
        if isinstance(node, dict):
            return {key: walk(item) for key, item in node.items()}
        return node

    return walk(value)


class RecordingMcpTool(PolicyMcpTool):
    """In record mode, replaces the key's own email address in each result, then captures it.

    The replaced result is what the model reads, so nothing downstream holds the address. A
    comment list names no issue, so its capture carries the `issueId` it was read for — the key
    the stub serves it back under.
    """

    # The address to replace; set by `build_live_toolset` when the recorder arms.
    scrubbed_email: ClassVar[str | None] = None

    _issue: str | None = None

    def shape_args(self, args: dict[str, Any]) -> dict[str, Any]:
        self._issue = args.get("issueId") if self.name == "list_comments" else None
        return args

    def shape_result(self, result: Any) -> Any:
        if not (recording() and isinstance(result, dict)):
            return result
        if self.scrubbed_email:
            result = replace_email(result, self.scrubbed_email)
        payload = corpus_payload(result)
        if self._issue and isinstance(payload, dict):
            payload = {"issueId": self._issue, **payload}
        capture_payload(self.name, payload)
        return result


class RecordingMcpToolset(PolicyMcpToolset):
    tool_class = RecordingMcpTool


def build_live_toolset() -> RecordingMcpToolset:
    """The live backend: the pinned MCP toolset.

    Construction is offline — the toolset connects only when its tools are first listed —
    but the key is read here, so a missing one fails at startup. In record mode the key's own
    email address is asked of the server here, so a recording that could not replace it never
    starts.
    """
    if recording():
        RecordingMcpTool.scrubbed_email = account_email(linear_token())
    return RecordingMcpToolset(
        connection_params=linear_connection_params(),
        tool_filter=list(LINEAR_TOOLS),
    )
