"""The AgentCard is the Router's retrieval document (phase decisions 10/11, task-2.6
decision 6): the card describes what the agent can be asked for — skills named by
capability in the user's vocabulary, each with real examples — and every run mode of
the app presents the same document.

The deterministic mode is not a lesser case here. It is the composition harness
(decision 11), so it is the mode the no-LLM fan-out demo routes over: since the kit
builds one card for every mode, the same-document property now holds by construction.
"""

from a2ui_agent_kit.server import build_agent_card

from app.card import APP_NAME
from app.config import CONFIG

URL = "http://localhost:11002"


def _card():
    return build_agent_card(CONFIG, URL)


def test_the_card_names_the_product_not_the_implementation():
    assert _card().name == APP_NAME == "Gmail"


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
    # No send tool exists on the Gmail MCP server at all, and the destructive tools are
    # withheld. A retrieval document that advertises them routes requests here that this
    # agent must then refuse.
    card = _card()
    text = " ".join(
        [card.description or ""]
        + [f"{s.name} {s.description} {' '.join(s.examples or [])}" for s in card.skills]
    ).lower()
    for claim in ("send", "delete", "trash", "spam"):
        assert claim not in text, claim
