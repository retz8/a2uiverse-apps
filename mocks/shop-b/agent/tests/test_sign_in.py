"""Shop B signs in with an API key (task-12.10 decisions 2 and 3): the card's `apiKey`
scheme, the demo key let in, no key or a wrong one answered 401."""

from a2ui_agent_kit.testing import serving, task_state

from app.config import CONFIG
from app.sign_in import DEMO_KEY, HEADER


async def test_the_card_declares_an_api_key_in_a_header_in_the_shoppers_words():
    async with serving(CONFIG) as agent:
        card = await agent.card()
    assert card["securitySchemes"] == {
        "apiKey": {
            "type": "apiKey",
            "in": "header",
            "name": HEADER,
            "description": "Your Northlight key. You'll find it on your Northlight account page.",
        }
    }
    assert card["security"] == [{"apiKey": []}]


async def test_the_demo_key_is_let_in_and_no_key_or_a_wrong_one_is_refused():
    part = {"kind": "text", "text": "What cameras do you have?"}
    async with serving(CONFIG) as agent:
        none = await agent.send(part)
        wrong = await agent.send(part, {HEADER: "not-the-key"})
        right = await agent.send(part, {HEADER: DEMO_KEY})
    assert none.status_code == 401 and wrong.status_code == 401
    assert task_state(right) == "completed"
