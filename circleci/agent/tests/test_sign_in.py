"""CircleCI on the kit's sign-in (task-12.10): the card's words, a fake account signed in
and answered, a rerun asking for more access until it is granted, and live mode's sign-in
with CircleCI — registered by dynamic registration, the account from `/api/v2/me`.
"""

import httpx
from a2ui_agent_kit.testing import requested_access, serving, task_state

from app.config import CONFIG
from app.sign_in import METADATA_URL, SCOPES, UPSTREAM, identify


async def test_the_card_asks_to_see_pipelines_first_in_the_customers_words(tmp_path):
    async with serving(CONFIG, state_dir=tmp_path) as agent:
        card = await agent.card()
    assert card["securitySchemes"]["signIn"]["flows"]["authorizationCode"]["scopes"] == SCOPES
    assert card["security"] == [{"signIn": ["pipelines.read"]}]


async def test_a_signed_in_account_is_answered_and_a_rerun_asks_for_more_access(tmp_path):
    async with serving(CONFIG, state_dir=tmp_path) as agent:
        token = await agent.sign_in("retz8", ["pipelines.read"])
        runs = await agent.send_text("How are my builds?", token["access_token"])
        proposal = await agent.send_action("rerun-workflow", token["access_token"])
        rerun = await agent.send_action("confirm-rerun", token["access_token"])
        more = await agent.sign_in("retz8", ["pipelines.write"], login_hint=await agent.sub(token))
        allowed = await agent.send_action("confirm-rerun", more["access_token"])
    assert task_state(runs) == task_state(proposal) == "completed"
    assert task_state(rerun) == "auth-required"
    assert requested_access(rerun) == [[{"signIn": ["pipelines.write"]}]]
    assert task_state(allowed) == "completed"


def test_circleci_is_asked_for_no_scopes_and_registered_by_its_metadata():
    assert UPSTREAM.vendor_scopes(["pipelines.read", "pipelines.write"]) == ()
    assert METADATA_URL == "https://app.circleci.com/.well-known/oauth-authorization-server"


async def test_the_account_is_circlecis_user_with_its_login_and_name():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/api/v2/me"
        assert request.headers["authorization"] == "Bearer cci_x"
        return httpx.Response(200, json={"id": "u-7", "login": "octo", "name": "Octo Cat"})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http:
        account, claims = await identify({"access_token": "cci_x"}, http)
    assert account == "u-7"
    assert claims == {"preferred_username": "octo", "name": "Octo Cat"}
