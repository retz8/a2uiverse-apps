"""The mode -> tools mapping and the LlmAgent construction, on this app's config.

The env-driven TOOL_BACKEND switch retired with the kit (task-3.2 / phase decision 5):
the tool backend is the CLI's --mode flag, resolved by a2uiverse_kit.modes.
"""

import pytest
from a2ui.schema.constants import A2UI_SCHEMA_BLOCK_START
from google.adk.tools.mcp_tool import McpToolset

from a2uiverse_kit.config import DEFAULT_MODEL
from a2uiverse_kit.modes import build_llm_agent, build_tools, model_name

from app.config import CONFIG
from app.mcp import MissingGoogleCredentialError
from app.tools import STUB_TOOLS


def test_model_name_defaults_to_cheap_tier(monkeypatch):
    monkeypatch.delenv("MODEL_NAME", raising=False)
    assert model_name(CONFIG) == DEFAULT_MODEL


def test_model_name_reads_env(monkeypatch):
    monkeypatch.setenv("MODEL_NAME", "gemini-1.5-pro")
    assert model_name(CONFIG) == "gemini-1.5-pro"


def test_stub_mode_gives_the_stub_toolset():
    tools = build_tools(CONFIG, "stub")
    assert {t.__name__ for t in tools} == {
        "search_threads",
        "get_thread",
        "list_labels",
        "create_draft",
        "label_thread",
        "unlabel_thread",
    }


def test_live_mode_gives_the_mcp_toolset(monkeypatch):
    monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", "a-project")
    monkeypatch.setattr("app.mcp.access_token", lambda: "token-value")
    tools = build_tools(CONFIG, "live")
    assert len(tools) == 1
    assert isinstance(tools[0], McpToolset)


def test_live_mode_without_a_credential_fails_fast(monkeypatch):
    # Never degrade to canned data: a convincing surface built from stub fixtures with
    # no signal that it is not live is worse than a failure.
    monkeypatch.delenv("GOOGLE_CLOUD_PROJECT", raising=False)
    with pytest.raises(MissingGoogleCredentialError):
        build_tools(CONFIG, "live")


def test_unknown_mode_is_rejected():
    with pytest.raises(ValueError) as excinfo:
        build_tools(CONFIG, "gmail")
    assert "gmail" in str(excinfo.value)


def test_backend_choice_is_logged(caplog):
    with caplog.at_level("INFO", logger="a2uiverse_kit.modes"):
        build_tools(CONFIG, "stub")
    assert "stub" in caplog.text


def test_build_llm_agent_wires_prompt_and_tools():
    a = build_llm_agent(CONFIG, "stub", model="gemini-2.5-flash")
    assert a.model == "gemini-2.5-flash"
    # A provider callable, never a plain string: ADK state-templates string
    # instructions, and the prompt's JSON braces would raise KeyError at runtime.
    assert not isinstance(a.instruction, str)
    prompt = a.instruction(None)
    # instruction carries the authored role and the SDK-injected schema block
    assert "Gmail agent" in prompt
    assert A2UI_SCHEMA_BLOCK_START in prompt
    assert len(a.tools) == len(STUB_TOOLS)


def test_stub_tools_hold_no_destructive_tool():
    # The stub mirrors the admitted MCP surface, so it must not grow a capability the
    # live backend deliberately withholds.
    names = {t.__name__ for t in STUB_TOOLS}
    assert not any("trash" in n or "spam" in n or "send" in n for n in names)
