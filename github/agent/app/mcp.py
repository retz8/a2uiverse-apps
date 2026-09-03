"""Remote GitHub MCP toolset: the full server surface, all toolsets (task 3.7).

The agent is another GitHub client acting as the user: its capability is whatever
the MCP server and the token allow (task-3.7 decision 1). There is no endpoint
restriction, no toolset pin, no tool filter, and no code-side confinement — the
PAT is the user's authority, and writes the agent performs land under the user's
name, on any repository the token reaches. The brake on writes is the interaction
grammar, not the inventory: content-bearing writes are proposed and confirmed,
with the target visible on the proposal (see `knowledge/github-domain.md`).

The toolset header is sent as an explicit `all` rather than omitted: without the
header the server serves only its *default* subset (44 tools at last count, which
loses the notification tools among others), where `all` serves the whole surface
(89 at last count).
"""

from __future__ import annotations

import os

from google.adk.tools.mcp_tool import StreamableHTTPConnectionParams

from a2ui_agent_kit.toolset import PolicyMcpToolset

# The unrestricted official remote server.
GITHUB_MCP_URL = "https://api.githubcopilot.com/mcp/"

# Explicit rather than omitted: no header means the server's default subset, not
# everything. `all` is the server's own vocabulary for the full surface.
GITHUB_MCP_TOOLSETS = "all"

# Deliberately not GITHUB_TOKEN: GitHub Actions injects that name and the gh CLI
# reads it implicitly, so a stray value could silently shadow this one.
PAT_ENV_VAR = "GITHUB_MCP_PAT"


class MissingGitHubPatError(RuntimeError):
    """Raised when the MCP backend is selected with no PAT configured."""


def github_pat() -> str:
    """Reads the PAT, failing fast rather than degrading to canned data.

    A silent fallback would render a convincing surface from stub fixtures with
    no signal that it is not live, so the stub is only ever a deliberate choice.
    """
    pat = os.environ.get(PAT_ENV_VAR)
    if not pat:
        raise MissingGitHubPatError(
            f"{PAT_ENV_VAR} is not set. The live agent needs a GitHub PAT — the "
            "agent acts as that token's user, and can do exactly what the token "
            "allows; set it in agent/.env. To run against canned fixture data "
            "instead, run with --mode stub."
        )
    return pat


def mcp_headers(pat: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {pat}",
        "X-MCP-Toolsets": GITHUB_MCP_TOOLSETS,
    }


def github_connection_params() -> StreamableHTTPConnectionParams:
    """Builds the connection parameters passed straight through to McpToolset.

    Pulled out of build_github_toolset so the unrestricted endpoint and the
    explicit-`all` toolset header — this branch's two load-bearing choices — can
    be asserted directly in tests, at the point where they are actually applied,
    rather than trusted by proxy through the constants alone.
    """
    return StreamableHTTPConnectionParams(
        url=GITHUB_MCP_URL,
        headers=mcp_headers(github_pat()),
    )


def build_github_toolset() -> PolicyMcpToolset:
    """Constructs the full-surface GitHub MCP toolset.

    Construction is offline: McpToolset stores its connection parameters and
    builds a session manager, connecting only when its tools are first listed.

    The toolset is the kit's policy wrapper with its no-op hooks (task-3.3
    decision 1): GitHub has no per-call policy — confinement is deliberately
    absent (task-3.7 decision 1) — but the interception point is standard agent
    anatomy, ready for any policy a later task lands.
    """
    return PolicyMcpToolset(connection_params=github_connection_params())
