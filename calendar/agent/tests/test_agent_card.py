"""The AgentCard is the Router's retrieval document (phase decisions 10/11, task-2.6
decision 6): the card describes what the agent can be asked for — skills named by
capability in the user's vocabulary, each with real examples — and every run mode of
the app presents the same document.

The deterministic mode is not a lesser case here. It is the composition harness
(decision 11), so it is the mode the no-LLM fan-out demo routes over: a stale card
there means the Router ranks the demo against a document nothing else matches.
"""

from agent_card import APP_NAME
from deterministic_agent.server import build_agent_card as det_build_agent_card
from llm_agent.server import build_agent_card as llm_build_agent_card

URL = "http://localhost:11003"


def test_every_mode_presents_the_same_retrieval_document():
    # The run mode is a launch detail; the Router sees one app.
    det = det_build_agent_card(URL)
    llm = llm_build_agent_card(URL)
    assert det.name == llm.name
    assert det.description == llm.description
    assert [s.model_dump() for s in det.skills] == [s.model_dump() for s in llm.skills]


def test_the_card_names_the_product_not_the_implementation():
    assert det_build_agent_card(URL).name == APP_NAME == "Google Calendar"


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


def test_the_card_does_not_claim_what_the_agent_cannot_do():
    # Deletion and every amending tool are withheld, and the agent cannot notify anyone.
    # A retrieval document that advertises them routes requests here that this agent must
    # then refuse. "invitation" is fine and "invite" as a noun is fine — answering one is
    # exactly what this agent does; what it cannot do is SEND one, which is why the banned
    # forms are the verbs.
    card = det_build_agent_card(URL)
    text = " ".join(
        [card.description or ""]
        + [f"{s.name} {s.description} {' '.join(s.examples or [])}" for s in card.skills]
    ).lower()
    for claim in ("delete", "cancel", "reschedule", "notify", "send an invite"):
        assert claim not in text, claim
