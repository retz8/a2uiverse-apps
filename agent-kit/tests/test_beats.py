"""The beat driver's usability gate.

A recording is usable when every turn completed and delivered A2UI, and the group as a
whole painted a surface. The `createSurface` requirement sits on the group rather than
on each turn (task-4.6 decision 15): a turn that only updates an existing surface is an
ordinary paint the protocol allows and the prompt prose invites, and it is the shape an
in-fragment instrument takes.
"""

from __future__ import annotations

import asyncio
import threading
from types import SimpleNamespace

import httpx

from a2ui_agent_kit import beats
from a2ui_agent_kit.beats import (
    AGENT_CARD_PATH,
    card_api_key_header,
    card_scopes,
    group_is_good,
    sign_in,
    sign_in_in_browser,
    turn_is_good,
)
from tests.test_sign_in import _Form, running


def turn(outcome: str = "completed", *, messages: list[dict] | None = None) -> dict:
    return {"outcome": outcome, "batches": [{"messages": messages or []}]}


CREATE = {"createSurface": {"surfaceId": "list"}}
UPDATE = {"updateDataModel": {"surfaceId": "list", "path": "/items", "value": []}}


def test_a_turn_is_good_when_it_completed_and_delivered_a2ui():
    assert turn_is_good(turn(messages=[CREATE])) == (True, "ok")
    assert turn_is_good(turn(messages=[UPDATE])) == (True, "ok")


def test_a_turn_that_did_not_complete_or_delivered_nothing_is_not_good():
    ok, why = turn_is_good(turn("apology", messages=[CREATE]))
    assert not ok and "apology" in why
    ok, why = turn_is_good(turn(messages=[]))
    assert not ok and "no A2UI" in why


def test_an_update_only_turn_is_recordable_when_its_group_painted():
    """The instruments' shape: a list paint, then turns that only mutate it."""
    ok, _ = group_is_good([turn(messages=[CREATE]), turn(messages=[UPDATE])])
    assert ok


def test_a_group_that_never_painted_is_not_recordable():
    ok, why = group_is_good([turn(messages=[UPDATE])])
    assert not ok and "createSurface" in why


def test_a_group_names_the_turn_that_failed():
    ok, why = group_is_good([turn(messages=[CREATE]), turn("apology", messages=[UPDATE])])
    assert not ok and "turn 2" in why


# ---- signing in (task-12.11 decision 7) --------------------------------------------------


def test_the_card_names_the_scopes_to_ask_or_no_sign_in():
    card = {
        "securitySchemes": {
            "signIn": {
                "type": "oauth2",
                "flows": {"authorizationCode": {"scopes": {"read": "Read", "write": "Write"}}},
            }
        }
    }
    assert card_scopes(card) == ["read", "write"]
    assert card_scopes({"name": "open"}) is None


async def test_the_driver_signs_in_as_the_named_fake_account_with_every_scope(tmp_path):
    async with running(tmp_path) as agent:
        def signed_in() -> str:
            with httpx.Client(base_url=agent.base) as client:
                return sign_in(client, "alan", card_scopes(client.get(AGENT_CARD_PATH).json()))

        token = await asyncio.to_thread(signed_in)
        answered = await agent.send("close_issue", token)
    # close_issue needs issues.write, beyond the first sign-in: granted up front, no escalation.
    assert answered.json()["result"]["status"]["state"] == "completed"


async def test_without_an_account_the_driver_signs_in_in_the_browser(tmp_path):
    # The person's browser, played by a thread: the agent's own sign-in page, an account
    # chosen, and the return caught on the driver's loopback address (RFC 8252).
    opened: list[str] = []

    def browser(url: str) -> None:
        def person():
            with httpx.Client() as http:
                page = http.get(url)
                form = _Form.read(page.text)
                chosen = http.post(form.action, data={"pending": form.pending, "account": "ada"})
                landed = http.get(chosen.headers["location"])
                opened.append(landed.text)

        opened.append(url)
        threading.Thread(target=person, daemon=True).start()

    async with running(tmp_path) as agent:
        def signed_in() -> str:
            with httpx.Client(base_url=agent.base) as client:
                scopes = card_scopes(client.get(AGENT_CARD_PATH).json())
                return sign_in_in_browser(client, scopes, open_browser=browser, timeout=10)

        token = await asyncio.to_thread(signed_in)
        answered = await agent.send("close_issue", token)
    assert answered.json()["result"]["status"]["state"] == "completed"
    assert opened[0].startswith(f"{agent.base}/oauth/authorize")
    assert "close this window" in opened[1]


def test_an_api_key_card_names_the_header_its_key_rides():
    card = {"securitySchemes": {"apiKey": {"type": "apiKey", "in": "header", "name": "X-Shop-Key"}}}
    assert card_api_key_header(card) == "X-Shop-Key"
    assert card_scopes(card) is None
    assert card_api_key_header({"name": "open"}) is None


def test_an_api_key_agent_is_not_driven_without_its_key(monkeypatch, tmp_path):
    card = {"securitySchemes": {"apiKey": {"type": "apiKey", "in": "header", "name": "X-Shop-Key"}}}

    class Client:
        def __init__(self, **_):
            pass

        def get(self, path):
            return SimpleNamespace(json=lambda: card)

    monkeypatch.setattr(beats.httpx, "Client", Client)
    assert beats.drive([], "m", tmp_path, "http://agent", tmp_path) == 2
