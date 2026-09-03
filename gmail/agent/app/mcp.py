"""Remote Gmail MCP toolset: read-write, with the destructive tools withheld (task 2.6).

The server exposes twenty-three tools under a single endpoint. There is no read-only
variant and no header that narrows the set server-side, so the inventory is pinned
client-side by `tool_filter`: the reads, draft creation, labelling, and label creation.
Trashing, spam marking, and sensitive-label application are excluded.

That exclusion is a SINGLE layer, and this says so rather than implying depth. Gmail
offers no scope granting the labelling tools without also authorizing trash and spam --
`gmail.modify` is the coarsest of the three the credential carries -- so the credential
permits what this filter withholds. Admitting the destructive tools is a decision for a
real authority surface (M8), not a scope grant.

The credential block is the kit's opt-in Google ADC helper (`a2uiverse_kit.google_adc`):
minted once by a developer outside the agent, read and refreshed by the library, never a
client secret or a consent flow.
"""

from __future__ import annotations

from google.adk.tools.mcp_tool import StreamableHTTPConnectionParams

from a2uiverse_kit import google_adc
from a2uiverse_kit.google_adc import MissingGoogleCredentialError, mcp_headers

from app.recording_toolset import RecordingMcpToolset

__all__ = [
    "GMAIL_MCP_URL",
    "GMAIL_SCOPES",
    "GMAIL_TOOLS",
    "MissingGoogleCredentialError",
    "access_token",
    "build_gmail_toolset",
    "gmail_connection_params",
    "mcp_headers",
    "quota_project",
]

GMAIL_MCP_URL = "https://gmailmcp.googleapis.com/mcp/v1"

# The scopes the credential must carry. gmail.modify is what the toggling tier needs; no
# narrower scope grants labelling.
GMAIL_SCOPES = (
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/cloud-platform",
)

# Pinned explicitly rather than inherited from the server's full set: the tool surface is a
# statement about what the agent is, so it stays reviewable and diffable. Everything absent
# here is absent deliberately -- see the module docstring.
GMAIL_TOOLS = (
    # reads
    "search_threads",
    "get_thread",
    "get_message",
    "list_labels",
    "list_drafts",
    "get_draft",
    # creating write -- painted as a proposal, fires on the user's confirm action
    "create_draft",
    # toggling writes -- fire directly on their action
    "label_thread",
    "unlabel_thread",
    "label_message",
    "unlabel_message",
    "create_label",
)

# Withheld deliberately: trash_message, trash_thread, untrash_message, untrash_thread,
# mark_message_spam, mark_thread_spam, unmark_message_spam, unmark_thread_spam,
# apply_sensitive_message_label, apply_sensitive_thread_label, update_message_labels.


def quota_project() -> str:
    """The project billed for the call, sent as X-Goog-User-Project."""
    return google_adc.quota_project("Gmail")


def access_token() -> str:
    """Mints a fresh access token from ADC, failing fast rather than degrading to canned data."""
    return google_adc.access_token(GMAIL_SCOPES, "Gmail")


def gmail_connection_params() -> StreamableHTTPConnectionParams:
    """Builds the connection parameters passed straight through to McpToolset.

    Pulled out of build_gmail_toolset so the endpoint and the headers -- this branch's
    load-bearing guarantees -- can be asserted directly in tests, at the point where they
    are actually applied, rather than trusted by proxy through the constants alone.
    """
    return StreamableHTTPConnectionParams(
        url=GMAIL_MCP_URL,
        headers=mcp_headers(access_token(), quota_project()),
    )


def build_gmail_toolset() -> RecordingMcpToolset:
    """Constructs the Gmail MCP toolset with the destructive tools filtered out.

    Construction is offline: the toolset stores its connection parameters and builds a
    session manager, connecting only when its tools are first listed.

    The toolset is the recording variant: in record mode every result is pseudonymized
    inside the tool, before it can be returned. See app/recording_toolset.py.
    """
    return RecordingMcpToolset(
        connection_params=gmail_connection_params(),
        tool_filter=list(GMAIL_TOOLS),
    )
