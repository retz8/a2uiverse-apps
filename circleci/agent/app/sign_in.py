"""The CircleCI app's sign-in (task-12.10): what a person grants, in their words, and live
mode's sign-in with CircleCI.

The first sign-in lets the agent see the person's projects, pipelines and runs; rerunning
and cancelling a workflow is asked for the first time the person asks for one. CircleCI's
own sign-in carries no scopes, so the split is the agent's.

Live mode signs in with CircleCI's OAuth server. The agent registers itself there by
dynamic registration on the first sign-in and keeps the registration in its store, so
there is nothing to set up at CircleCI. CircleCI offers no refresh: when its token ends,
the person signs in again.
"""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import httpx
from a2ui_agent_kit.sign_in import FakeAccount, SignIn
from a2ui_agent_kit.sign_in_vendor import VendorOAuth

from app.projects import API, api_headers

READ = "pipelines.read"
WRITE = "pipelines.write"

SCOPES = {
    READ: "See your projects, pipelines and their runs",
    WRITE: "Rerun and cancel your workflows",
}

METADATA_URL = "https://app.circleci.com/.well-known/oauth-authorization-server"
MCP_URL = "https://mcp.circleci.com/v1/mcp"


async def identify(token: Mapping[str, Any], http: httpx.AsyncClient) -> tuple[str, dict[str, str]]:
    """The account by its CircleCI user id; its login and name, from `/api/v2/me`."""
    response = await http.get(f"{API}/v2/me", headers=api_headers(token["access_token"]))
    response.raise_for_status()
    me = response.json()
    claims = {"preferred_username": me.get("login"), "name": me.get("name")}
    return str(me["id"]), {k: v for k, v in claims.items() if isinstance(v, str) and v}


UPSTREAM = VendorOAuth(
    vendor="CircleCI",
    scopes={},
    identify=identify,
    metadata_url=METADATA_URL,
    resource=MCP_URL,
)

SIGN_IN = SignIn(
    scopes=SCOPES,
    first_sign_in_scopes=[READ],
    fake_accounts=[FakeAccount("retz8", {"preferred_username": "retz8"})],
    action_scopes={"confirm-rerun": [WRITE]},
    tool_scopes={"rerun_workflow": [WRITE], "cancel_workflow": [WRITE]},
    upstream=UPSTREAM,
)
