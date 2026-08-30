import re

from starlette.testclient import TestClient

from deterministic_agent.server import (
    CORS_ORIGIN_REGEX,
    DEFAULT_PORT,
    build_agent_card,
    build_app,
)
from deterministic_agent.catalog import supported_catalog_ids


def test_default_port_is_11002():
    assert DEFAULT_PORT == 11002


def test_cors_regex_allows_localhost_and_devtunnel_but_not_arbitrary():
    pattern = re.compile(CORS_ORIGIN_REGEX)
    assert pattern.fullmatch("http://localhost:5173")
    assert pattern.fullmatch("https://vnw20xbg-5173.asse.devtunnels.ms")
    assert not pattern.fullmatch("https://evil.com")


def test_agent_card_advertises_streaming_and_the_a2ui_v09_extension():
    card = build_agent_card("http://localhost:11001")
    assert card.capabilities.streaming is True
    uris = [ext.uri for ext in card.capabilities.extensions]
    assert "https://a2ui.org/a2a-extension/a2ui/v0.9" in uris
    a2ui_ext = next(e for e in card.capabilities.extensions if e.uri.endswith("a2ui/v0.9"))
    assert a2ui_ext.params["supportedCatalogIds"] == supported_catalog_ids()


def test_build_app_defaults_card_url_to_host_port():
    app = build_app("localhost", DEFAULT_PORT)
    with TestClient(app) as client:
        resp = client.get("/.well-known/agent-card.json")
    assert resp.status_code == 200
    assert resp.json()["url"] == f"http://localhost:{DEFAULT_PORT}"


def test_build_app_advertises_base_url_override():
    # The --base-url override makes the card advertise a tunnel/proxy URL so the
    # client's message/send targets the public URL instead of an unreachable localhost.
    app = build_app("localhost", DEFAULT_PORT, base_url="https://tunnel.example")
    with TestClient(app) as client:
        resp = client.get("/.well-known/agent-card.json")
    assert resp.status_code == 200
    assert resp.json()["url"] == "https://tunnel.example"
