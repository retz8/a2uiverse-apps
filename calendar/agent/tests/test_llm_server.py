from catalog_common import supported_catalog_ids
from llm_agent.server import DEFAULT_PORT, build_agent_card


def test_default_port_is_the_app_port_in_every_mode():
    # One port per app regardless of run mode: both agents default to the app's port.
    from deterministic_agent.server import DEFAULT_PORT as DET_PORT

    assert DEFAULT_PORT == DET_PORT == 11003


def test_card_advertises_single_version_a2ui_extension_and_our_catalog():
    card = build_agent_card("http://localhost:11001")
    assert card.url == "http://localhost:11001"
    assert card.capabilities.streaming is True

    extensions = card.capabilities.extensions
    assert extensions, "agent card must advertise the a2ui extension"
    # single-version: exactly one a2ui extension, at the spec-fixed v0.9.1 URI
    a2ui = [e for e in extensions if e.uri.endswith("a2ui/v0.9.1")]
    assert len(a2ui) == 1
    assert a2ui[0].params["supportedCatalogIds"] == supported_catalog_ids()
