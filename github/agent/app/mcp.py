"""Remote GitHub MCP toolset: read-only, explicitly pinned toolsets (task 7.3).

Read-only is enforced twice and independently — the server's read-only endpoint,
so write tools never enter the tool inventory, and a fine-grained PAT carrying no
write permission. Both are required: the `pull_requests` toolset ships
`merge_pull_request` and `pull_request_review_write` in its unrestricted form,
which is precisely the capability the compose-and-confirm beat must lack.

Repository confinement is prompt-level only. A fine-grained PAT that can read
repositories the user does not own must use public-repository read access, which
cannot be narrowed to one repository — and which grants no access to the user's
own private repositories. Read-only makes the blast radius nil.
"""

from __future__ import annotations

import os

from google.adk.tools.mcp_tool import StreamableHTTPConnectionParams

from a2uiverse_kit.toolset import PolicyMcpToolset

# The read-only variant of the official remote server.
GITHUB_MCP_URL = "https://api.githubcopilot.com/mcp/readonly"

# Pinned explicitly rather than inherited from the server's default set or
# requested as "all": the tool surface is a statement about what the agent is, so
# it stays reviewable and diffable instead of drifting with GitHub's releases.
GITHUB_MCP_TOOLSETS = (
    "context",
    "repos",
    "issues",
    "pull_requests",
    "users",
    "notifications",
)

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
            f"{PAT_ENV_VAR} is not set. The live agent needs a fine-grained "
            "GitHub PAT with read-only access to public repositories; set it in "
            "agent/.env. To run against canned fixture data instead, run with "
            "--mode stub."
        )
    return pat


def mcp_headers(pat: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {pat}",
        "X-MCP-Toolsets": ",".join(GITHUB_MCP_TOOLSETS),
    }


def github_connection_params() -> StreamableHTTPConnectionParams:
    """Builds the connection parameters passed straight through to McpToolset.

    Pulled out of build_github_toolset so the read-only endpoint and the
    toolset pin — this branch's two load-bearing guarantees — can be asserted
    directly in tests, at the point where they are actually applied, rather
    than trusted by proxy through the constants alone.
    """
    return StreamableHTTPConnectionParams(
        url=GITHUB_MCP_URL,
        headers=mcp_headers(github_pat()),
    )


def build_github_toolset() -> PolicyMcpToolset:
    """Constructs the read-only GitHub MCP toolset.

    Construction is offline: McpToolset stores its connection parameters and
    builds a session manager, connecting only when its tools are first listed.

    The toolset is the kit's policy wrapper with its no-op hooks (task-3.3
    decision 1): GitHub has no per-call policy today — the endpoint is read-only
    and the data is public repo data — but the interception point is standard
    agent anatomy, and the write tier (task 3.7) lands its guard on these hooks.
    """
    return PolicyMcpToolset(connection_params=github_connection_params())
