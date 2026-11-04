import re

from starlette.testclient import TestClient

from a2ui_agent_kit.catalog import catalog_context
from a2ui_agent_kit.server import CORS_ORIGIN_REGEX, build_agent_card, build_app
from a2ui_agent_kit.versions import EXTENSION_URIS

from app.config import CONFIG


def test_default_port_is_11001():
    assert CONFIG.default_port == 11001


def test_cors_regex_allows_localhost_and_devtunnel_but_not_arbitrary():
    pattern = re.compile(CORS_ORIGIN_REGEX)
    assert pattern.fullmatch("http://localhost:5173")
    assert pattern.fullmatch("https://a1b2c3d4-5173.asse.devtunnels.ms")
    assert not pattern.fullmatch("https://evil.com")


def test_agent_card_advertises_streaming_and_the_a2ui_extension():
    # One card for all modes. v0.9.1 alone, as `a2ui_versions` in app/config.py names it: one
    # entry, naming the catalog under the version's key.
    card = build_agent_card(CONFIG, "http://localhost:11001")
    assert card.capabilities.streaming is True
    params = {"supportedCatalogIds": catalog_context(CONFIG).supported_catalog_ids()}
    assert [(ext.uri, ext.params) for ext in card.capabilities.extensions] == [
        (EXTENSION_URIS["v0.9.1"], {"v0.9.1": params}),
    ]


def test_build_app_defaults_card_url_to_host_port():
    app = build_app(CONFIG, "deterministic", "localhost", CONFIG.default_port)
    with TestClient(app) as client:
        resp = client.get("/.well-known/agent-card.json")
    assert resp.status_code == 200
    assert resp.json()["url"] == f"http://localhost:{CONFIG.default_port}"


def test_build_app_advertises_base_url_override():
    # The --base-url override makes the card advertise a tunnel/proxy URL so the
    # client's message/send targets the public URL instead of an unreachable localhost.
    app = build_app(
        CONFIG, "deterministic", "localhost", CONFIG.default_port, base_url="https://tunnel.example"
    )
    with TestClient(app) as client:
        resp = client.get("/.well-known/agent-card.json")
    assert resp.status_code == 200
    assert resp.json()["url"] == "https://tunnel.example"
