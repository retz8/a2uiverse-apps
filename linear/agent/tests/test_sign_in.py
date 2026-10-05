"""Linear on the kit's sign-in (task-12.10): the card's words, a fake account signed in
and answered, a write asking for more access until it is granted, and live mode's sign-in
with Linear — registered by dynamic registration, the account from its ID token or from
`get_user("me")`.
"""

import base64
import json
import time

import httpx
from a2ui_agent_kit.testing import requested_access, serving, task_state

from app.config import CONFIG
from app.sign_in import METADATA_URL, SCOPES, UPSTREAM, identify


async def test_the_card_asks_to_see_issues_first_in_the_customers_words(tmp_path):
    async with serving(CONFIG, state_dir=tmp_path) as agent:
        card = await agent.card()
    assert card["securitySchemes"]["signIn"]["flows"]["authorizationCode"]["scopes"] == SCOPES
    assert card["security"] == [{"signIn": ["issues.read"]}]


async def test_a_signed_in_account_is_answered_and_a_write_asks_for_more_access(tmp_path):
    async with serving(CONFIG, state_dir=tmp_path) as agent:
        token = await agent.sign_in("me", ["issues.read"])
        issues = await agent.send_text("What's assigned to me?", token["access_token"])
        opened = await agent.send_action("open-issue", token["access_token"])
        change = await agent.send_action("confirm-change", token["access_token"])
        more = await agent.sign_in("me", ["issues.write"], login_hint=await agent.sub(token))
        allowed = await agent.send_action("confirm-change", more["access_token"])
    assert task_state(issues) == task_state(opened) == "completed"
    assert task_state(change) == "auth-required"
    assert requested_access(change) == [[{"signIn": ["issues.write"]}]]
    assert task_state(allowed) == "completed"


def test_linear_is_asked_for_read_then_write_and_registered_by_its_metadata():
    assert UPSTREAM.vendor_scopes(["issues.read"]) == ("read",)
    assert UPSTREAM.vendor_scopes(["issues.read", "issues.write"]) == ("read", "write")
    assert METADATA_URL == "https://mcp.linear.app/.well-known/oauth-authorization-server"


async def test_the_account_comes_from_linears_id_token_when_it_sends_one():
    payload = {"sub": "u-9", "aud": "dyn-1", "email": "me@example.com", "name": "Me", "exp": time.time() + 60}
    raw = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    async with httpx.AsyncClient() as http:
        account, claims = await identify({"id_token": f"h.{raw}.s", "client_id": "dyn-1"}, http)
    assert account == "u-9"
    assert claims == {"email": "me@example.com", "name": "Me"}


async def test_otherwise_the_account_is_asked_of_linear_as_get_user_me():
    user = {"id": "u-9", "email": "me@example.com", "name": "Me", "displayName": "me"}

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["authorization"] == "Bearer lin_x"
        body = json.loads(request.content)
        if body.get("method") == "tools/call":
            assert body["params"] == {"name": "get_user", "arguments": {"query": "me"}}
            result = {"content": [{"type": "text", "text": json.dumps(user)}], "structuredContent": user}
            return httpx.Response(200, text=f"event: message\ndata: {json.dumps({'jsonrpc': '2.0', 'id': 2, 'result': result})}\n\n")
        return httpx.Response(200, json={"jsonrpc": "2.0", "id": 1, "result": {}})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http:
        account, claims = await identify({"access_token": "lin_x", "client_id": "dyn-1"}, http)
    assert account == "u-9"
    assert claims == {"email": "me@example.com", "name": "Me", "preferred_username": "me"}
