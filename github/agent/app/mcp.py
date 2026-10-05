"""Remote GitHub MCP toolset: the full server surface, all toolsets (task 3.7).

The agent is another GitHub client acting as the user: its capability is whatever
the MCP server and the signed-in account allow (task-3.7 decision 1). There is no
endpoint restriction, no toolset pin, no tool filter, and no code-side confinement —
writes the agent performs land under the person's name, on any repository their
sign-in reaches. The brakes on writes are the sign-in's write scope, asked for on the
first write (`app/sign_in.py`), and the interaction grammar: content-bearing writes are
proposed and confirmed, with the target visible on the proposal (see
`knowledge/github-domain.md`).

The credential is the signed-in account's GitHub token, held by the agent's sign-in
(task-12.10): one toolset per account, its token read again on every call.

The toolset header is sent as an explicit `all` rather than omitted: without the
header the server serves only its *default* subset (44 tools at last count, which
loses the notification tools among others), where `all` serves the whole surface
(89 at last count).
"""

from __future__ import annotations

from google.adk.tools.mcp_tool import StreamableHTTPConnectionParams

from a2ui_agent_kit.sign_in import SignedInAccount
from a2ui_agent_kit.toolset import PolicyMcpToolset, account_bearer

# The unrestricted official remote server.
GITHUB_MCP_URL = "https://api.githubcopilot.com/mcp/"

# Explicit rather than omitted: no header means the server's default subset, not
# everything. `all` is the server's own vocabulary for the full surface.
GITHUB_MCP_TOOLSETS = "all"


def mcp_headers(access_token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {access_token}",
        "X-MCP-Toolsets": GITHUB_MCP_TOOLSETS,
    }


def github_connection_params(account: SignedInAccount) -> StreamableHTTPConnectionParams:
    """Builds the connection parameters passed straight through to McpToolset.

    Pulled out of build_github_toolset so the unrestricted endpoint and the
    explicit-`all` toolset header — this branch's two load-bearing choices — can
    be asserted directly in tests, at the point where they are actually applied,
    rather than trusted by proxy through the constants alone.
    """
    return StreamableHTTPConnectionParams(
        url=GITHUB_MCP_URL,
        headers=mcp_headers(account.vendor_token["access_token"]),
    )


def build_github_toolset(account: SignedInAccount) -> PolicyMcpToolset:
    """Constructs the full-surface GitHub MCP toolset for one signed-in account.

    Construction is offline: McpToolset stores its connection parameters and
    builds a session manager, connecting only when its tools are first listed.

    The toolset is the kit's policy wrapper with its no-op hooks (task-3.3
    decision 1): GitHub has no per-call policy — confinement is deliberately
    absent (task-3.7 decision 1) — but the interception point is standard agent
    anatomy, ready for any policy a later task lands.
    """
    return PolicyMcpToolset(
        connection_params=github_connection_params(account),
        header_provider=account_bearer,
    )
