"""The GitHub app's sign-in (task-12.10): what a person grants, in their words, and
live mode's sign-in with GitHub itself.

The first sign-in lets the agent read; writing — commenting, reviewing, merging, opening
issues and pull requests — is asked for when the person first asks for one. GitHub's own
`repo` scope already covers both, so the agent splits them, not GitHub: a GitHub MCP tool
its server does not mark read-only needs the write scope.

Live mode signs in with the publisher's GitHub OAuth App, its client ID and secret in
`agent/.env` (see the README). GitHub's OAuth App tokens do not expire; a token revoked
at GitHub ends the account's sign-ins on the next call.
"""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import httpx
from a2ui_agent_kit.sign_in import FakeAccount, SignIn
from a2ui_agent_kit.sign_in_vendor import ClientFromEnv, VendorOAuth

READ = "github.read"
WRITE = "github.write"

SCOPES = {
    READ: "See your repositories, pull requests, issues and notifications",
    WRITE: "Comment, review, merge, and open issues and pull requests as you",
}

# The vendor scopes each scope needs. `repo` reads and writes; `read:org` lets the agent
# see the organisations' repositories the person works in; `notifications`, which GitHub's
# MCP server asks of its notification tools though its REST API takes `repo` for them.
GITHUB_SCOPES = {
    READ: ["repo", "read:org", "notifications"],
    WRITE: ["repo", "read:org", "notifications"],
}
# For the person's email on the sign-in, when they keep it private.
IDENTITY_SCOPES = ["user:email"]

CLIENT_ID_ENV = "GITHUB_CLIENT_ID"
CLIENT_SECRET_ENV = "GITHUB_CLIENT_SECRET"

AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
TOKEN_URL = "https://github.com/login/oauth/access_token"
API = "https://api.github.com"


def _api_headers(access_token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


async def identify(token: Mapping[str, Any], http: httpx.AsyncClient) -> tuple[str, dict[str, str]]:
    """The account by GitHub's numeric user id; its login, name and primary email."""
    headers = _api_headers(token["access_token"])
    response = await http.get(f"{API}/user", headers=headers)
    response.raise_for_status()
    user = response.json()
    claims = {"preferred_username": user["login"]}
    if user.get("name"):
        claims["name"] = user["name"]
    email = user.get("email")
    emails = await http.get(f"{API}/user/emails", headers=headers)
    if emails.status_code == 200:
        primary = next((e["email"] for e in emails.json() if e.get("primary") and e.get("verified")), None)
        email = primary or email
    if email:
        claims["email"] = email
    return str(user["id"]), claims


async def revoke(
    vendor_token: Mapping[str, Any], client_id: str, secret: str | None, http: httpx.AsyncClient
) -> None:
    """GitHub revokes an OAuth App's grant for the person, by the app's own credentials."""
    response = await http.request(
        "DELETE",
        f"{API}/applications/{client_id}/grant",
        auth=(client_id, secret or ""),
        headers={"Accept": "application/vnd.github+json"},
        json={"access_token": vendor_token["access_token"]},
    )
    if response.status_code not in (204, 404):
        response.raise_for_status()


UPSTREAM = VendorOAuth(
    vendor="GitHub",
    scopes=GITHUB_SCOPES,
    identity_scopes=IDENTITY_SCOPES,
    identify=identify,
    client=ClientFromEnv(CLIENT_ID_ENV, CLIENT_SECRET_ENV),
    authorization_endpoint=AUTHORIZE_URL,
    token_endpoint=TOKEN_URL,
    revoke=revoke,
)

SIGN_IN = SignIn(
    scopes=SCOPES,
    first_sign_in_scopes=[READ],
    fake_accounts=[FakeAccount("retz8", {"preferred_username": "retz8"})],
    # Deterministic mode: submitting and approving a review write.
    action_scopes={"submit": [WRITE], "approve": [WRITE]},
    # Stub and live mode: GitHub marks its read tools read-only; every other tool writes.
    unmarked_tool_scopes=[WRITE],
    upstream=UPSTREAM,
)
