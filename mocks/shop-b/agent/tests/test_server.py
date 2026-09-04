import re

from starlette.testclient import TestClient

from a2ui_agent_kit.catalog import catalog_context
from a2ui_agent_kit.server import CORS_ORIGIN_REGEX, build_agent_card, build_app

from app.config import CONFIG


def test_default_port_is_the_app_port():
    assert CONFIG.default_port == 12002


def test_cors_regex_allows_localhost_and_devtunnel_but_not_arbitrary():
    pattern = re.compile(CORS_ORIGIN_REGEX)
    assert pattern.fullmatch("http://localhost:5173")
    assert pattern.fullmatch("https://vnw20xbg-5173.asse.devtunnels.ms")
    assert not pattern.fullmatch("https://evil.com")


def test_agent_card_advertises_streaming_and_the_a2ui_extension():
    card = build_agent_card(CONFIG, "http://localhost:12002")
    assert card.capabilities.streaming is True
    a2ui_ext = next(e for e in card.capabilities.extensions if e.uri.endswith("a2ui/v0.9.1"))
    assert a2ui_ext.params["supportedCatalogIds"] == catalog_context(CONFIG).supported_catalog_ids()


def test_build_app_defaults_card_url_to_host_port():
    app = build_app(CONFIG, "deterministic", "localhost", CONFIG.default_port)
    with TestClient(app) as client:
        resp = client.get("/.well-known/agent-card.json")
    assert resp.status_code == 200
    assert resp.json()["url"] == f"http://localhost:{CONFIG.default_port}"


def test_build_app_advertises_base_url_override():
    app = build_app(
        CONFIG, "deterministic", "localhost", CONFIG.default_port, base_url="https://tunnel.example"
    )
    with TestClient(app) as client:
        resp = client.get("/.well-known/agent-card.json")
    assert resp.status_code == 200
    assert resp.json()["url"] == "https://tunnel.example"
