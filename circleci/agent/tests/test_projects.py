"""The account's projects, asked of CircleCI's API with its own token (task-12.10
decision 9)."""

from __future__ import annotations

import httpx
import pytest
from a2ui_agent_kit.sign_in import VendorSignInEnded

from app.projects import followed_projects


def _circleci(handler):
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


async def test_followed_projects_are_named_by_repository_with_their_ids():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["authorization"] == "Bearer t0k"
        if request.url.path == "/api/v1.1/projects":
            return httpx.Response(
                200,
                json=[
                    # A project made through CircleCI's GitHub App: its id is in its address.
                    {"vcs_url": "//circleci.com/org-1/5475943e", "reponame": "a2uiverse"},
                    # A project made through the GitHub OAuth app: its id is asked by slug.
                    {"vcs_url": "https://github.com/acme/site", "vcs_type": "github", "username": "acme", "reponame": "site"},
                ],
            )
        assert request.url.path == "/api/v2/project/gh/acme/site"
        return httpx.Response(200, json={"id": "abc-123", "slug": "gh/acme/site"})

    async with _circleci(handler) as http:
        projects = await followed_projects("t0k", http)
    assert projects == [{"name": "a2uiverse", "id": "5475943e"}, {"name": "site", "id": "abc-123"}]


async def test_circleci_refusing_the_token_ends_the_accounts_sign_in():
    async with _circleci(lambda request: httpx.Response(401)) as http:
        with pytest.raises(VendorSignInEnded):
            await followed_projects("t0k", http)
