"""Gmail on the kit's sign-in (task-12.10): the card's words, a fake account signed in
and answered, opening a message asking "Read your email" — the deterministic scope
boundary (decision 4) — a write asking for more access, and live mode's sign-in with
Google.
"""

import base64
import json
import time

import httpx
from a2ui_agent_kit.testing import requested_access, serving, task_state

from app.config import CONFIG
from app.sign_in import SCOPES, UPSTREAM, identify


async def test_the_card_asks_to_see_the_inbox_first_in_the_customers_words(tmp_path):
    async with serving(CONFIG, state_dir=tmp_path) as agent:
        card = await agent.card()
    assert card["securitySchemes"]["signIn"]["flows"]["authorizationCode"]["scopes"] == SCOPES
    assert SCOPES["inbox"] == "See your inbox"
    assert card["security"] == [{"signIn": ["inbox"]}]


async def test_opening_a_message_asks_to_read_your_email(tmp_path):
    async with serving(CONFIG, state_dir=tmp_path) as agent:
        token = await agent.sign_in("you", ["inbox"])
        inbox = await agent.send_text("What needs my attention?", token["access_token"])
        opened = await agent.send_action("open-thread", token["access_token"])
        more = await agent.sign_in("you", ["messages"], login_hint=await agent.sub(token))
        read = await agent.send_action("open-thread", more["access_token"])
        draft = await agent.send_action("confirm-draft", more["access_token"])
    assert task_state(inbox) == "completed"
    assert task_state(opened) == "auth-required"
    assert requested_access(opened) == [[{"signIn": ["messages"]}]]
    assert SCOPES["messages"] == "Read your email"
    assert task_state(read) == "completed"
    assert requested_access(draft) == [[{"signIn": ["organize"]}]]


async def test_each_fake_account_signs_in_to_its_own_mail(tmp_path):
    # Work mail and personal mail (task-12.11): the chooser offers both, and each is answered
    # from its own.
    async with serving(CONFIG, state_dir=tmp_path) as agent:
        painted = {}
        for account in ("you", "personal"):
            token = await agent.sign_in(account, ["inbox"])
            answer = await agent.send_text("What needs my attention?", token["access_token"])
            assert task_state(answer) == "completed"
            painted[account] = json.dumps(answer.json())
    assert painted["you"] != painted["personal"]
    assert "Mei Silva" in painted["you"] and "Mei Silva" not in painted["personal"]


def test_google_is_asked_for_what_the_granted_scopes_need():
    assert UPSTREAM.vendor_scopes(["inbox"]) == ("https://www.googleapis.com/auth/gmail.readonly",)
    assert UPSTREAM.vendor_scopes(["inbox", "messages", "organize"]) == (
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.modify",
    )


async def test_the_account_is_googles_sub_with_its_email_and_name():
    payload = {
        "iss": "https://accounts.google.com",
        "aud": "client-1",
        "sub": "1093",
        "email": "you@example.com",
        "name": "You",
        "exp": time.time() + 60,
    }
    raw = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    async with httpx.AsyncClient() as http:
        account, claims = await identify({"id_token": f"h.{raw}.s", "client_id": "client-1"}, http)
    assert account == "1093"
    assert claims == {"email": "you@example.com", "name": "You"}
