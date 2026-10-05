"""The Gmail app's sign-in (task-12.10): what a person grants, in their words, and live
mode's sign-in with Google.

The first sign-in lets the agent see the inbox — who wrote, the subject, a line of each
thread. Opening a message to read it is asked for the first time the person opens one,
after Google's own split between seeing mail and reading it (decision 4); writing drafts
and labelling mail is asked for the first time the person asks for one.

Live mode signs in with the publisher's OAuth client in the Google Cloud project, shared
with Google Calendar, its client ID and secret in `agent/.env` (see the README). Google
issues the agent a refresh token; while the client is in Testing status that refresh
token lasts 7 days, after which the person signs in again.
"""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import httpx
from a2ui_agent_kit.sign_in import FakeAccount, SignIn
from a2ui_agent_kit.sign_in_vendor import ClientFromEnv, VendorOAuth, id_token_claims

INBOX = "inbox"
MESSAGES = "messages"
ORGANIZE = "organize"

SCOPES = {
    INBOX: "See your inbox",
    MESSAGES: "Read your email",
    ORGANIZE: "Write drafts and label your email",
}

_GMAIL = "https://www.googleapis.com/auth/gmail"

# The vendor scopes each scope needs. Searching the inbox needs `gmail.readonly`, so both
# reads ask for it; the agent keeps reading a message apart. `gmail.modify` covers the
# drafts and the labels, and no narrower scope grants labelling.
GOOGLE_SCOPES = {
    INBOX: [f"{_GMAIL}.readonly"],
    MESSAGES: [f"{_GMAIL}.readonly"],
    ORGANIZE: [f"{_GMAIL}.modify"],
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
    first_sign_in_scopes=[INBOX],
    # Work mail and personal mail, each with its own data (task-12.11).
    fake_accounts=[
        FakeAccount("you", {"email": "you@example.com"}),
        FakeAccount("personal", {"email": "you.personal@example.net"}),
    ],
    action_scopes={
        "open-thread": [MESSAGES],
        "confirm-draft": [ORGANIZE],
        "label-toggle": [ORGANIZE],
    },
    tool_scopes={
        "get_thread": [MESSAGES],
        "get_message": [MESSAGES],
        "create_draft": [ORGANIZE],
        "label_thread": [ORGANIZE],
        "unlabel_thread": [ORGANIZE],
        "label_message": [ORGANIZE],
        "unlabel_message": [ORGANIZE],
        "create_label": [ORGANIZE],
    },
    upstream=UPSTREAM,
)
