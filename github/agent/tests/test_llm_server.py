from a2ui_agent_kit.catalog import catalog_context
from a2ui_agent_kit.server import build_agent_card

from app.config import CONFIG


def test_default_port_is_the_app_port_in_every_mode():
    # One port per app regardless of run mode: the config's port serves all modes.
    assert CONFIG.default_port == 11001


def test_card_advertises_single_version_a2ui_extension_and_our_catalog():
    card = build_agent_card(CONFIG, "http://localhost:11001")
    assert card.url == "http://localhost:11001"
    assert card.capabilities.streaming is True

    extensions = card.capabilities.extensions
    assert extensions, "agent card must advertise the a2ui extension"
    # single-version: exactly one a2ui extension, at the spec-fixed v0.9.1 URI
    a2ui = [e for e in extensions if e.uri.endswith("a2ui/v0.9.1")]
    assert len(a2ui) == 1
    assert a2ui[0].params["supportedCatalogIds"] == (
        catalog_context(CONFIG).supported_catalog_ids()
    )
