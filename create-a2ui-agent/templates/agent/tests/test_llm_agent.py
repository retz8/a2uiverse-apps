"""The mode -> tools mapping and the LlmAgent construction, on this app's config."""

import pytest
from a2ui.schema.constants import A2UI_SCHEMA_BLOCK_START

from a2ui_agent_kit.config import DEFAULT_MODEL
from a2ui_agent_kit.modes import build_llm_agent, build_tools, model_name

from app.config import CONFIG
from app.mcp import LiveToolsetNotWiredError
from app.tools import STUB_TOOLS


def test_model_name_defaults_to_the_kit_default(monkeypatch):
    monkeypatch.delenv("MODEL_NAME", raising=False)
    assert model_name(CONFIG) == DEFAULT_MODEL


def test_model_name_reads_env(monkeypatch):
    monkeypatch.setenv("MODEL_NAME", "gemini-1.5-pro")
    assert model_name(CONFIG) == "gemini-1.5-pro"


def test_stub_mode_gives_the_stub_toolset():
    tools = build_tools(CONFIG, "stub")
    assert [t.__name__ for t in tools] == [t.__name__ for t in STUB_TOOLS]


def test_live_mode_fails_fast_until_wired():
    # Replace this test with one asserting the real toolset once app/mcp.py names the
    # MCP server. Until then, live mode must refuse rather than degrade to canned data.
    with pytest.raises(LiveToolsetNotWiredError):
        build_tools(CONFIG, "live")


def test_unknown_mode_is_rejected():
    with pytest.raises(ValueError) as excinfo:
        build_tools(CONFIG, "nope")
    assert "nope" in str(excinfo.value)


def test_backend_choice_is_logged(caplog):
    with caplog.at_level("INFO", logger="a2ui_agent_kit.modes"):
        build_tools(CONFIG, "stub")
    assert "stub" in caplog.text


def test_build_llm_agent_wires_prompt_and_tools():
    a = build_llm_agent(CONFIG, "stub", model="gemini-2.5-flash")
    assert a.model == "gemini-2.5-flash"
    # A provider callable, never a plain string: ADK state-templates string
    # instructions, and the prompt's JSON braces would raise KeyError at runtime.
    assert not isinstance(a.instruction, str)
    prompt = a.instruction(None)
    assert "__DISPLAY_NAME__ agent" in prompt
    assert A2UI_SCHEMA_BLOCK_START in prompt
    assert len(a.tools) == len(STUB_TOOLS)
