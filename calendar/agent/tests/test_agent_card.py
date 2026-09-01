"""The AgentCard is the Router's retrieval document (phase decisions 10/11, task-2.6
decision 6): the card describes what the agent can be asked for — skills named by
capability in the user's vocabulary, each with real examples — and every run mode of
the app presents the same document.

The deterministic mode is not a lesser case here. It is the composition harness
(decision 11), so it is the mode the no-LLM fan-out demo routes over: a stale card
there means the Router ranks the demo against a document nothing else matches.
"""

from a2uiverse_kit.server import build_agent_card

from app.card import APP_NAME
from app.config import CONFIG


def _card():
    return build_agent_card(CONFIG, URL)

URL = "http://localhost:11003"


def test_the_card_names_the_product_not_the_implementation():
    assert _card().name == APP_NAME == "Google Calendar"


def test_skills_are_capabilities_with_several_examples_each():
    card = _card()
    assert len(card.skills) >= 2
    for skill in card.skills:
        assert skill.examples and len(skill.examples) >= 3, skill.id


def test_a_skill_covers_the_cross_cutting_attention_space():
    # Every card in the phase carries examples here, or the fan-out utterance
    # reaches only the agent whose own vocabulary it happens to match.
    card = _card()
    examples = [ex.lower() for skill in card.skills for ex in (skill.examples or [])]
    assert any("needs my attention" in ex for ex in examples)


def test_the_card_does_not_claim_what_the_agent_cannot_do():
    # Deletion and every amending tool are withheld, and the agent cannot notify anyone.
    # A retrieval document that advertises them routes requests here that this agent must
    # then refuse. "invitation" is fine and "invite" as a noun is fine — answering one is
    # exactly what this agent does; what it cannot do is SEND one, which is why the banned
    # forms are the verbs.
    card = _card()
    text = " ".join(
        [card.description or ""]
        + [f"{s.name} {s.description} {' '.join(s.examples or [])}" for s in card.skills]
    ).lower()
    for claim in ("delete", "cancel", "reschedule", "notify", "send an invite"):
        assert claim not in text, claim
