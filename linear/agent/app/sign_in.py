"""The Linear app's sign-in (task-12.10): what a person grants, in their words, and live
mode's sign-in with Linear.

The first sign-in lets the agent see the person's issues; creating, changing and
commenting on them is asked for the first time the person asks for one.

Live mode signs in with Linear's own OAuth server. The agent registers itself there by
dynamic registration on the first sign-in and keeps the registration in its store, so
there is nothing to set up at Linear.
"""

from __future__ import annotations

import json
from collections.abc import Mapping
from typing import Any

import httpx
from a2ui_agent_kit.corpus import corpus_payload
from a2ui_agent_kit.sign_in import FakeAccount, SignIn
from a2ui_agent_kit.sign_in_vendor import VendorOAuth, VendorSignInError, id_token_claims

READ = "issues.read"
WRITE = "issues.write"

SCOPES = {
    READ: "See your issues",
    WRITE: "Create, change and comment on your issues",
}

LINEAR_SCOPES = {READ: ["read"], WRITE: ["write"]}
IDENTITY_SCOPES = ["openid", "email"]

METADATA_URL = "https://mcp.linear.app/.well-known/oauth-authorization-server"
MCP_URL = "https://mcp.linear.app/mcp"


def _jsonrpc_message(response: httpx.Response) -> dict[str, Any]:
    """The JSON-RPC message of a streamable-HTTP response, sent as JSON or as one SSE event."""
    for line in response.text.splitlines():
        if line.startswith("data: "):
            return json.loads(line[len("data: ") :])
    return json.loads(response.text)


async def get_me(access_token: str, http: httpx.AsyncClient) -> dict[str, Any]:
    """The signed-in user, asked of Linear's MCP server as `get_user("me")`."""
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-06-18",
    }
    init = await http.post(
        MCP_URL,
        headers=headers,
        json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2025-06-18",
                "capabilities": {},
                "clientInfo": {"name": "a2uiverse-linear-sign-in", "version": "0"},
            },
        },
    )
    init.raise_for_status()
    if session := init.headers.get("mcp-session-id"):
        headers["Mcp-Session-Id"] = session
    await http.post(MCP_URL, headers=headers, json={"jsonrpc": "2.0", "method": "notifications/initialized"})
    response = await http.post(
        MCP_URL,
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
    if not isinstance(user, dict) or not user.get("id"):
        raise VendorSignInError("Linear did not say who signed in")
    return user


async def identify(token: Mapping[str, Any], http: httpx.AsyncClient) -> tuple[str, dict[str, str]]:
    """The account from Linear's ID token where it sends one, otherwise from `get_user`."""
    try:
        claims = id_token_claims(token)
        display = {k: claims[k] for k in ("email", "name", "preferred_username") if claims.get(k)}
        return str(claims["sub"]), display
    except VendorSignInError:
        pass
    user = await get_me(token["access_token"], http)
    display = {"email": user.get("email"), "name": user.get("name"), "preferred_username": user.get("displayName")}
    return str(user["id"]), {k: v for k, v in display.items() if isinstance(v, str) and v}


UPSTREAM = VendorOAuth(
    vendor="Linear",
    scopes=LINEAR_SCOPES,
    identity_scopes=IDENTITY_SCOPES,
    identify=identify,
    metadata_url=METADATA_URL,
    resource=MCP_URL,
)

SIGN_IN = SignIn(
    scopes=SCOPES,
    first_sign_in_scopes=[READ],
    fake_accounts=[FakeAccount("me", {"email": "me@example.com"})],
    action_scopes={"confirm-change": [WRITE]},
    tool_scopes={"save_issue": [WRITE], "save_comment": [WRITE]},
    upstream=UPSTREAM,
)
