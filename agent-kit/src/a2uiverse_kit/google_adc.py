"""Opt-in Google ADC credential block for Google-backed vendors.

Not standard agent anatomy: only an agent whose MCP server is Google's wires this
in (Gmail, Calendar); a vendor with its own auth story never imports it. The
credential is Application Default Credentials, minted once by a developer outside
the agent (`gcloud auth application-default login`). The agent reads it and lets
the library refresh it; it never sees a client secret and never runs a consent
flow.

Every failure fails fast rather than degrading to canned data: a silent fallback
would render a convincing surface from stub fixtures with no signal that it is not
live, so the stub is only ever a deliberate choice (`--mode stub`).
"""

from __future__ import annotations

import os
from collections.abc import Sequence

import google.auth
import google.auth.exceptions
import google.auth.transport.requests

PROJECT_ENV_VAR = "GOOGLE_CLOUD_PROJECT"


class MissingGoogleCredentialError(RuntimeError):
    """Raised when the MCP backend is selected with no usable credential."""


def quota_project(vendor: str) -> str:
    """The project billed for the call, sent as X-Goog-User-Project."""
    project = os.environ.get(PROJECT_ENV_VAR)
    if not project:
        raise MissingGoogleCredentialError(
            f"{PROJECT_ENV_VAR} is not set. The live agent sends it as the "
            f"X-Goog-User-Project header on every {vendor} MCP call; set it in agent/.env. "
            "To run against canned fixture data instead, run with --mode stub."
        )
    return project


def access_token(scopes: Sequence[str], vendor: str) -> str:
    """Mints a fresh access token from ADC, failing fast rather than degrading to canned data."""
    try:
        credentials, _ = google.auth.default(scopes=list(scopes))
    except google.auth.exceptions.DefaultCredentialsError as exc:
        raise MissingGoogleCredentialError(
            f"No Application Default Credentials. The live agent needs a user credential "
            f"carrying the {vendor} scopes:\n\n  "
            + "\n  ".join(scopes)
            + "\n\n"
            f"Mint it with the command in agent/README.md, 'Setting up the {vendor} "
            "credential'. Do NOT run `gcloud auth application-default login` with only "
            "these scopes: --scopes REPLACES the granted set, and every Google app in this "
            f"repo shares one credential, so a {vendor}-only grant revokes the other "
            "Google agents'. The README's command lists the union.\n\n"
            "To run against canned fixture data instead, run with --mode stub."
        ) from exc
    credentials.refresh(google.auth.transport.requests.Request())
    if not credentials.token:
        raise MissingGoogleCredentialError(
            "Application Default Credentials produced no access token. Re-run "
            f"`gcloud auth application-default login` with the {vendor} scopes."
        )
    return credentials.token


def mcp_headers(token: str, project: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "X-Goog-User-Project": project,
    }
