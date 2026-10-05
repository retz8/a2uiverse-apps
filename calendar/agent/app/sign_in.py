"""The Google Calendar app's sign-in (task-12.10): what a person grants, in their words,
and live mode's sign-in with Google.

The first sign-in lets the agent see the person's calendar; adding events and answering
invitations is asked for the first time the person asks for one.

Live mode signs in with the publisher's OAuth client in the Google Cloud project, shared
with Gmail, its client ID and secret in `agent/.env` (see the README). Google issues the
agent a refresh token; while the client is in Testing status that refresh token lasts 7
days, after which the person signs in again.
"""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import httpx
from a2ui_agent_kit.sign_in import FakeAccount, SignIn
from a2ui_agent_kit.sign_in_vendor import ClientFromEnv, VendorOAuth, id_token_claims

READ = "calendar.read"
WRITE = "calendar.write"

SCOPES = {
    READ: "See your calendar",
    WRITE: "Add events and answer invitations on your calendar",
}

_CALENDAR = "https://www.googleapis.com/auth/calendar"

# The vendor scopes each scope needs. Answering an invitation changes an event the person
# does not own, so writing needs `calendar.events`, not `calendar.events.owned`.
GOOGLE_SCOPES = {
    READ: [f"{_CALENDAR}.events.readonly"],
    WRITE: [f"{_CALENDAR}.events"],
}
IDENTITY_SCOPES = ["openid", "email", "profile"]

CLIENT_ID_ENV = "GOOGLE_OAUTH_CLIENT_ID"
CLIENT_SECRET_ENV = "GOOGLE_OAUTH_CLIENT_SECRET"

AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
REVOKE_URL = "https://oauth2.googleapis.com/revoke"
ISSUERS = ["https://accounts.google.com", "accounts.google.com"]

# Offline access for a refresh token; the scopes granted before kept in the new token; the
# consent screen every time, so a sign-in after the last one ended gets a refresh token.
AUTHORIZE_PARAMS = {"access_type": "offline", "include_granted_scopes": "true", "prompt": "consent"}


async def identify(token: Mapping[str, Any], http: httpx.AsyncClient) -> tuple[str, dict[str, str]]:
    """The account by its Google `sub`; its email and name, from the ID token."""
    claims = id_token_claims(token, ISSUERS)
    display = {k: claims[k] for k in ("email", "name") if claims.get(k)}
    return str(claims["sub"]), display


UPSTREAM = VendorOAuth(
    vendor="Google",
    scopes=GOOGLE_SCOPES,
    identity_scopes=IDENTITY_SCOPES,
    identify=identify,
    client=ClientFromEnv(CLIENT_ID_ENV, CLIENT_SECRET_ENV),
    authorization_endpoint=AUTHORIZE_URL,
    token_endpoint=TOKEN_URL,
    revocation_endpoint=REVOKE_URL,
    authorize_params=AUTHORIZE_PARAMS,
    login_hint_param="login_hint",
)

SIGN_IN = SignIn(
    scopes=SCOPES,
    first_sign_in_scopes=[READ],
    fake_accounts=[FakeAccount("you", {"email": "you@example.com"})],
    action_scopes={"confirm-event": [WRITE], "rsvp-toggle": [WRITE]},
    tool_scopes={"create_event": [WRITE], "respond_to_event": [WRITE]},
    upstream=UPSTREAM,
)
