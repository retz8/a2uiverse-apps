"""Server/card/mode wiring: one card at v0.9.1, mode resolution, ADK isolation."""

import subprocess
import sys
from pathlib import Path

import pytest

from a2ui_agent_kit.modes import (
    build_model,
    build_tools,
    generate_content_config,
    model_effort,
    model_name,
    resolve_executor,
)
from a2ui_agent_kit.server import build_agent_card, build_app

V091_URI = "https://a2ui.org/a2a-extension/a2ui/v0.9.1"


def test_card_carries_the_config_identity_and_v091_extension(any_config):
    card = build_agent_card(any_config, "http://localhost:19999")
    assert card.name == any_config.name
    assert card.description == any_config.description
    assert card.version == any_config.version
    assert [s.id for s in card.skills] == [s.id for s in any_config.skills]
    uris = [e.uri for e in card.capabilities.extensions]
    assert uris == [V091_URI]  # one card, v0.9.1, every mode


def test_card_names_its_provider_and_help_page_when_the_config_does(tmp_path):
    # The platform's ways out of a refused paint and its key page's help link read these
    # (a2uiverse task-12.13 decision 23); an app that names neither carries neither.
    from a2a.types import AgentProvider

    from .conftest import make_config

    named = make_config(
        "basic",
        tmp_path,
        provider=AgentProvider(organization="Example", url="https://example.com"),
        documentation_url="https://example.com/help",
    )
    card = build_agent_card(named, "http://localhost:19999")
    assert card.provider == AgentProvider(organization="Example", url="https://example.com")
    assert card.documentation_url == "https://example.com/help"
    bare = build_agent_card(make_config("basic", tmp_path), "http://localhost:19999")
    assert bare.provider is None and bare.documentation_url is None


def test_card_version_is_the_configs(tmp_path):
    # The app's version moves through its config (a2uiverse task-13.7 decision 5).
    from .conftest import make_config

    card = build_agent_card(make_config("basic", tmp_path, version="2.3.0"), "http://localhost:19999")
    assert card.version == "2.3.0"


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


def test_live_mode_accepts_a_single_toolset_or_a_list_of_plain_tools(tmp_path):
    """A vendor hands over one MCP toolset; an app with no vendor hands over callables.

    Both reach the ADK agent as a tools list, so the kit does not need to assert that
    a live backend is an MCP toolset (task-4.6 decision 16).
    """
    from .conftest import make_config

    class FakeToolset:  # pragma: no cover - identity only
        ...

    def list_products():  # pragma: no cover - identity only
        ...

    def open_product():  # pragma: no cover - identity only
        ...

    toolset = FakeToolset()
    one = make_config("basic", tmp_path, live_toolset_factory=lambda: toolset)
    assert build_tools(one, "live") == [toolset]

    many = make_config(
        "basic", tmp_path, live_toolset_factory=lambda: [list_products, open_product]
    )
    assert build_tools(many, "live") == [list_products, open_product]


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


def test_effort_resolution_prefers_env_then_config_then_default(basic_config, tmp_path, monkeypatch):
    # The thinking tier resolves as the model name does (a2uiverse task-17.1 decision 3).
    from a2ui_agent_kit.config import DEFAULT_EFFORT

    from .conftest import make_config

    monkeypatch.delenv("MODEL_EFFORT", raising=False)
    assert DEFAULT_EFFORT == "default"
    assert model_effort(basic_config) == DEFAULT_EFFORT
    config = make_config("basic", tmp_path, effort="low")
    assert model_effort(config) == "low"
    monkeypatch.setenv("MODEL_EFFORT", "default")
    assert model_effort(config) == "default"


def test_effort_refuses_a_word_outside_the_tier(basic_config, monkeypatch):
    monkeypatch.setenv("MODEL_EFFORT", "high")
    with pytest.raises(ValueError, match="MODEL_EFFORT"):
        model_effort(basic_config)


def test_an_anthropic_name_builds_the_direct_api_class():
    # ADK's registry sends a bare `claude-…` to Vertex and `anthropic/…` to LiteLLM; the kit
    # builds the direct-API class itself for the prefixed name (a2uiverse task-17.1 decision 2).
    from google.adk.models.anthropic_llm import AnthropicLlm

    model = build_model("anthropic/claude-x")
    assert isinstance(model, AnthropicLlm)
    assert model.model == "claude-x"


def test_any_other_name_reaches_adk_as_the_string_it_was():
    assert build_model("gemini-3.8-flash") == "gemini-3.8-flash"
    assert build_model("some-other/model") == "some-other/model"


def test_low_effort_spends_no_thinking_budget():
    config = generate_content_config("low")
    assert config.thinking_config.thinking_budget == 0


def test_default_effort_configures_nothing():
    assert generate_content_config("default") is None


def test_build_llm_agent_wires_the_model_and_the_tier(basic_config, monkeypatch):
    from google.adk.models.anthropic_llm import AnthropicLlm

    from a2ui_agent_kit.modes import build_llm_agent

    monkeypatch.setenv("MODEL_EFFORT", "low")
    agent = build_llm_agent(basic_config, "stub", model="anthropic/claude-x")
    assert isinstance(agent.model, AnthropicLlm)
    assert agent.model.model == "claude-x"
    assert agent.generate_content_config.thinking_config.thinking_budget == 0
    monkeypatch.setenv("MODEL_EFFORT", "default")
    agent = build_llm_agent(basic_config, "stub", model="gemini-x")
    assert agent.model == "gemini-x"
    # ADK normalizes a missing config to an empty one; nothing about thinking is set.
    assert agent.generate_content_config.thinking_config is None


def test_build_llm_agent_wires_the_measurement_callbacks(basic_config):
    """The model layer is the seam: ADK's before- and after-model callbacks measure every
    request (a2uiverse task-17.3 decision 6)."""
    from a2ui_agent_kit.measurement import after_model, before_model
    from a2ui_agent_kit.modes import build_llm_agent

    agent = build_llm_agent(basic_config, "stub", model="gemini-x")
    assert before_model in agent.canonical_before_model_callbacks
    assert after_model in agent.canonical_after_model_callbacks
