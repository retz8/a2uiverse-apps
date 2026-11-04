"""The AgentCard is a retrieval document: it describes what the agent can be asked for —
skills named by capability, each with real example utterances — and every run mode
presents the same card."""

from a2ui_agent_kit.catalog import catalog_context
from a2ui_agent_kit.server import build_agent_card
from a2ui_agent_kit.versions import EXTENSION_URIS

from app.card import APP_NAME
from app.config import CONFIG

URL = "http://localhost:12002"


def _card():
    return build_agent_card(CONFIG, URL)


def test_the_card_names_the_product_not_the_implementation():
    assert _card().name == APP_NAME == "Shop B"


def test_skills_are_capabilities_with_several_examples_each():
    card = _card()
    assert card.skills
    for skill in card.skills:
        assert skill.examples and len(skill.examples) >= 3, skill.id


def test_the_card_advertises_the_a2ui_extension_and_the_catalog():
    # v0.9.1 alone, as `a2ui_versions` in app/config.py names it: one entry, naming
    # the catalog under the version's key.
    card = _card()
    assert card.capabilities.streaming is True
    params = {"supportedCatalogIds": catalog_context(CONFIG).supported_catalog_ids()}
    assert [(ext.uri, ext.params) for ext in card.capabilities.extensions] == [
        (EXTENSION_URIS["v0.9.1"], {"v0.9.1": params}),
    ]
