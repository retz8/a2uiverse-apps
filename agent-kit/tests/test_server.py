"""Server/card/mode wiring: one card at v0.9.1, mode resolution, ADK isolation."""

import subprocess
import sys
from pathlib import Path

import pytest

from a2ui_agent_kit.modes import build_tools, model_name, resolve_executor
from a2ui_agent_kit.server import build_agent_card, build_app

V091_URI = "https://a2ui.org/a2a-extension/a2ui/v0.9.1"


def test_card_carries_the_config_identity_and_v091_extension(any_config):
    card = build_agent_card(any_config, "http://localhost:19999")
    assert card.name == any_config.name
    assert card.description == any_config.description
    assert [s.id for s in card.skills] == [s.id for s in any_config.skills]
    uris = [e.uri for e in card.capabilities.extensions]
    assert uris == [V091_URI]  # one card, v0.9.1, every mode


def test_card_advertises_the_apps_catalog(any_config):
    from a2ui_agent_kit.catalog import catalog_context

    card = build_agent_card(any_config, "http://localhost:19999")
    (extension,) = card.capabilities.extensions
    expected = catalog_context(any_config).supported_catalog_ids()
    assert extension.params["supportedCatalogIds"] == expected


def test_deterministic_app_builds_and_serves_without_adk(basic_config):
    app = build_app(basic_config, "deterministic", "localhost", 19999)
    assert app is not None


def test_deterministic_build_never_imports_adk(tmp_path):
    # In a fresh interpreter: building the deterministic app must not pull google.adk.
    fixtures = Path(__file__).resolve().parent
    code = f"""
import sys
sys.path.insert(0, {str(fixtures.parent)!r})
from tests.conftest import make_config
from pathlib import Path
from a2ui_agent_kit.server import build_app
config = make_config("basic", Path({str(tmp_path)!r}))
build_app(config, "deterministic", "localhost", 19999)
assert "google.adk" not in sys.modules, "deterministic mode imported ADK"
print("clean")
"""
    result = subprocess.run(
        [sys.executable, "-c", code], capture_output=True, text=True, check=False
    )
    assert result.returncode == 0, result.stderr
    assert "clean" in result.stdout


def test_unknown_mode_is_rejected_with_the_valid_choices(basic_config):
    with pytest.raises(ValueError, match="deterministic"):
        resolve_executor(basic_config, "llm")


def test_live_mode_without_a_toolset_factory_is_rejected(basic_config):
    with pytest.raises(ValueError, match="live_toolset_factory"):
        build_tools(basic_config, "live")


def test_stub_tools_come_from_the_config(basic_config, tmp_path):
    from .conftest import make_config

    def fake_tool():  # pragma: no cover - identity only
        ...

    config = make_config("basic", tmp_path, stub_tools=(fake_tool,))
    assert build_tools(config, "stub") == [fake_tool]


def test_model_resolution_prefers_env_then_config_then_default(basic_config, tmp_path, monkeypatch):
    from a2ui_agent_kit.config import DEFAULT_MODEL

    from .conftest import make_config

    monkeypatch.delenv("MODEL_NAME", raising=False)
    assert model_name(basic_config) == DEFAULT_MODEL
    config = make_config("basic", tmp_path, model="gemini-x")
    assert model_name(config) == "gemini-x"
    monkeypatch.setenv("MODEL_NAME", "gemini-env")
    assert model_name(config) == "gemini-env"
