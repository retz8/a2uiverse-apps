"""GitHub on the kit's sign-in (task-12.10): the card's words, a fake account signed in
and answered, a write asking for more access until it is granted, and live mode's
sign-in with GitHub — who signed in, and the grant revoked at the end.
"""

import json

import httpx
from a2ui_agent_kit.sign_in_vendor import VendorOAuth
from a2ui_agent_kit.testing import requested_access, serving, task_state

from app.config import CONFIG
from app.sign_in import SCOPES, SIGN_IN, UPSTREAM, identify, revoke


async def test_the_card_asks_to_read_first_in_the_customers_words(tmp_path):
    async with serving(CONFIG, state_dir=tmp_path) as agent:
        card = await agent.card()
    scheme = card["securitySchemes"]["signIn"]
    assert scheme["flows"]["authorizationCode"]["scopes"] == SCOPES
    assert card["security"] == [{"signIn": ["github.read"]}]


async def test_a_signed_in_account_is_answered_and_a_write_asks_for_more_access(tmp_path):
    async with serving(CONFIG, state_dir=tmp_path) as agent:
        assert (await agent.send_text("What needs my attention?", None)).status_code == 401
        token = await agent.sign_in("retz8", ["github.read"])
        read = await agent.send_text("What needs my attention?", token["access_token"])
        write = await agent.send_action("approve", token["access_token"])
        more = await agent.sign_in("retz8", ["github.write"], login_hint=await agent.sub(token))
        allowed = await agent.send_action("approve", more["access_token"])
    assert task_state(read) == "completed"
    assert task_state(write) == "auth-required"
    assert requested_access(write) == [[{"signIn": ["github.write"]}]]
    assert task_state(allowed) == "completed"


def test_live_mode_signs_in_with_the_publishers_oauth_app_asking_for_repo():
    assert isinstance(SIGN_IN.upstream, VendorOAuth)
    assert UPSTREAM.vendor_scopes(["github.read"]) == ("repo", "read:org")
    assert UPSTREAM.vendor_scopes(["github.read", "github.write"]) == ("repo", "read:org")


def _github(handler):
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


async def test_the_account_is_githubs_user_id_with_its_login_name_and_primary_email():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["authorization"] == "Bearer gho_1"
        if request.url.path == "/user":
            return httpx.Response(200, json={"id": 42, "login": "octo", "name": "Octo Cat", "email": None})
        return httpx.Response(
            200,
            json=[
                {"email": "old@example.com", "primary": False, "verified": True},
                {"email": "octo@example.com", "primary": True, "verified": True},
            ],
        )

    async with _github(handler) as http:
        account, claims = await identify({"access_token": "gho_1"}, http)
    assert account == "42"
    assert claims == {"preferred_username": "octo", "name": "Octo Cat", "email": "octo@example.com"}


async def test_the_grant_is_revoked_with_the_apps_own_credentials():
    seen = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append((request.method, request.url.path, request.headers["authorization"], json.loads(request.content)))
        return httpx.Response(204)

    async with _github(handler) as http:
        await revoke({"access_token": "gho_1"}, "client-1", "secret-1", http)
    method, path, auth, body = seen[0]
    assert (method, path, body) == ("DELETE", "/applications/client-1/grant", {"access_token": "gho_1"})
    assert auth.startswith("Basic ")
