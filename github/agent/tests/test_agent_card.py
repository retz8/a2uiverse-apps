"""The AgentCard is the Router's retrieval document (phase decisions 10/11, task-2.6
decision 6): the card describes what the agent can be asked for — skills named by
capability in the user's vocabulary, each with real examples — and every run mode of
the app presents the same document.
"""

from deterministic_agent.server import build_agent_card as det_build_agent_card
from llm_agent.server import build_agent_card as llm_build_agent_card

URL = "http://localhost:11001"


def test_every_mode_presents_the_same_retrieval_document():
    # The run mode is a launch detail; the Router sees one app.
    det = det_build_agent_card(URL)
    llm = llm_build_agent_card(URL)
    assert det.name == llm.name
    assert det.description == llm.description
    assert [s.model_dump() for s in det.skills] == [s.model_dump() for s in llm.skills]


def test_the_card_names_the_product_not_the_implementation():
    assert det_build_agent_card(URL).name == "GitHub"


def test_skills_are_capabilities_with_several_examples_each():
    card = det_build_agent_card(URL)
    assert len(card.skills) >= 2
    for skill in card.skills:
        assert skill.examples and len(skill.examples) >= 3, skill.id


def test_a_skill_covers_the_cross_cutting_attention_space():
    # Every card in the phase carries examples here, or the fan-out utterance
    # reaches only the agent whose own vocabulary it happens to match.
    card = det_build_agent_card(URL)
    examples = [ex.lower() for skill in card.skills for ex in (skill.examples or [])]
    assert any("needs my attention" in ex for ex in examples)
