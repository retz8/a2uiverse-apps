from a2ui_agent_kit.catalog import catalog_context
from a2ui_agent_kit.server import build_agent_card
from a2ui_agent_kit.versions import EXTENSION_URIS

from app.config import CONFIG


def test_default_port_is_the_app_port_in_every_mode():
    # One port per app regardless of run mode: the config's port serves all modes.
    assert CONFIG.default_port == 11003


def test_card_advertises_the_a2ui_extension_and_our_catalog():
    card = build_agent_card(CONFIG, "http://localhost:11003")
    assert card.url == "http://localhost:11003"
    assert card.capabilities.streaming is True
    # Both versions, as `a2ui_versions` in app/config.py names them: one entry per
    # version, oldest first, each naming the catalog flat.
    params = {"supportedCatalogIds": catalog_context(CONFIG).supported_catalog_ids()}
    assert [(ext.uri, ext.params) for ext in card.capabilities.extensions] == [
        (EXTENSION_URIS["v0.9"], params),
        (EXTENSION_URIS["v0.9.1"], params),
    ]
