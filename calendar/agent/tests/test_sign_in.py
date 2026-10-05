"""Google Calendar on the kit's sign-in (task-12.10): the card's words, a fake account
signed in and answered, a write asking for more access until it is granted, and live
mode's sign-in with Google.
"""

from a2ui_agent_kit.testing import requested_access, serving, task_state

from app.config import CONFIG
from app.sign_in import SCOPES, UPSTREAM


async def test_the_card_asks_to_see_the_calendar_first_in_the_customers_words(tmp_path):
    async with serving(CONFIG, state_dir=tmp_path) as agent:
        card = await agent.card()
    assert card["securitySchemes"]["signIn"]["flows"]["authorizationCode"]["scopes"] == SCOPES
    assert card["security"] == [{"signIn": ["calendar.read"]}]


async def test_a_signed_in_account_is_answered_and_a_write_asks_for_more_access(tmp_path):
    async with serving(CONFIG, state_dir=tmp_path) as agent:
        token = await agent.sign_in("you", ["calendar.read"])
        agenda = await agent.send_text("What's on today?", token["access_token"])
        opened = await agent.send_action("open-event", token["access_token"])
        rsvp = await agent.send_action("rsvp-toggle", token["access_token"])
        more = await agent.sign_in("you", ["calendar.write"], login_hint=await agent.sub(token))
        allowed = await agent.send_action("rsvp-toggle", more["access_token"])
    assert task_state(agenda) == "completed"
    assert task_state(opened) == "completed"
    assert task_state(rsvp) == "auth-required"
    assert requested_access(rsvp) == [[{"signIn": ["calendar.write"]}]]
    assert task_state(allowed) == "completed"


def test_google_is_asked_for_what_the_granted_scopes_need():
    assert UPSTREAM.vendor_scopes(["calendar.read"]) == (
        "https://www.googleapis.com/auth/calendar.events.readonly",
    )
    assert UPSTREAM.vendor_scopes(["calendar.read", "calendar.write"]) == (
        "https://www.googleapis.com/auth/calendar.events.readonly",
        "https://www.googleapis.com/auth/calendar.events",
    )
