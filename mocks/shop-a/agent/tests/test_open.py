"""Shop A stays open (task-12.10 decision 3): its card asks for no sign-in, and a request
with no credential is answered."""

from a2ui_agent_kit.testing import serving, task_state

from app.config import CONFIG


async def test_shop_a_asks_for_no_sign_in_and_answers_without_one():
    async with serving(CONFIG) as agent:
        card = await agent.card()
        answer = await agent.send({"kind": "text", "text": "What cameras do you have?"})
    assert "securitySchemes" not in card and "security" not in card
    assert task_state(answer) == "completed"
