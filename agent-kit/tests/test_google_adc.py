"""The opt-in Google ADC credential block: header assembly and fail-fast errors.

Every failure must fail fast and name the stub alternative (`--mode stub`) — a
silent fallback to canned data would render a convincing surface with no signal
that it is not live.
"""

from __future__ import annotations

from types import SimpleNamespace

import google.auth
import google.auth.exceptions
import pytest

from a2uiverse_kit.google_adc import (
    PROJECT_ENV_VAR,
    MissingGoogleCredentialError,
    access_token,
    mcp_headers,
    quota_project,
)

SCOPES = (
    "https://www.googleapis.com/auth/example.readonly",
    "https://www.googleapis.com/auth/cloud-platform",
)


def test_headers_carry_the_bearer_token_and_the_quota_project():
    headers = mcp_headers("token-value", "a-project")
    assert headers["Authorization"] == "Bearer token-value"
    assert headers["X-Goog-User-Project"] == "a-project"


def test_quota_project_reads_the_env(monkeypatch):
    monkeypatch.setenv(PROJECT_ENV_VAR, "a-project")
    assert quota_project("Example") == "a-project"


def test_missing_project_fails_fast_and_names_the_alternative(monkeypatch):
    monkeypatch.delenv(PROJECT_ENV_VAR, raising=False)
    with pytest.raises(MissingGoogleCredentialError) as excinfo:
        quota_project("Example")
    message = str(excinfo.value)
    assert PROJECT_ENV_VAR in message
    assert "Example" in message
    assert "--mode stub" in message


def test_missing_adc_fails_fast_naming_the_scopes(monkeypatch):
    def no_adc(**_kwargs):
        raise google.auth.exceptions.DefaultCredentialsError("none")

    monkeypatch.setattr(google.auth, "default", no_adc)
    with pytest.raises(MissingGoogleCredentialError) as excinfo:
        access_token(SCOPES, "Example")
    message = str(excinfo.value)
    for scope in SCOPES:
        assert scope in message
    assert "Example" in message
    assert "--mode stub" in message


def test_access_token_refreshes_and_returns_the_token(monkeypatch):
    credentials = SimpleNamespace(token=None, refresh=lambda _req: None)

    def default(**kwargs):
        assert kwargs["scopes"] == list(SCOPES)
        credentials.token = "fresh-token"
        return credentials, "project"

    monkeypatch.setattr(google.auth, "default", default)
    assert access_token(SCOPES, "Example") == "fresh-token"


def test_an_empty_token_is_an_error_not_a_value(monkeypatch):
    credentials = SimpleNamespace(token=None, refresh=lambda _req: None)
    monkeypatch.setattr(google.auth, "default", lambda **_kw: (credentials, "project"))
    with pytest.raises(MissingGoogleCredentialError):
        access_token(SCOPES, "Example")
