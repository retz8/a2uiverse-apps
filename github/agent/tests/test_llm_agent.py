"""The mode -> tools mapping and the LlmAgent construction, on this app's config.

The env-driven TOOL_BACKEND switch retired with the kit (task-3.2 / phase decision 5):
the tool backend is the CLI's --mode flag, resolved by a2ui_agent_kit.modes.
"""

import pytest
from a2ui.schema.constants import A2UI_SCHEMA_BLOCK_START
from google.adk.tools.mcp_tool import McpToolset

from a2ui_agent_kit.config import DEFAULT_MODEL
from a2ui_agent_kit.modes import build_llm_agent, build_tools, model_name

from app.config import CONFIG
from app.mcp import PAT_ENV_VAR, MissingGitHubPatError
from app.tools import STUB_TOOLS


def test_model_name_defaults_to_cheap_tier(monkeypatch):
    monkeypatch.delenv("MODEL_NAME", raising=False)
    assert model_name(CONFIG) == DEFAULT_MODEL


def test_model_name_reads_env(monkeypatch):
    monkeypatch.setenv("MODEL_NAME", "gemini-1.5-pro")
    assert model_name(CONFIG) == "gemini-1.5-pro"


def test_stub_mode_gives_the_read_only_pair():
    tools = build_tools(CONFIG, "stub")
    assert {t.__name__ for t in tools} == {"list_pull_requests", "get_pull_request"}


def test_live_mode_gives_the_mcp_toolset(monkeypatch):
    monkeypatch.setenv(PAT_ENV_VAR, "ghp_example")
    tools = build_tools(CONFIG, "live")
    assert len(tools) == 1
    assert isinstance(tools[0], McpToolset)


def test_live_mode_without_a_pat_fails_fast(monkeypatch):
    # Never degrade to canned data: a convincing surface built from stub fixtures with
    # no signal that it is not live is worse than a failure.
    monkeypatch.delenv(PAT_ENV_VAR, raising=False)
    with pytest.raises(MissingGitHubPatError):
        build_tools(CONFIG, "live")


def test_unknown_mode_is_rejected():
    with pytest.raises(ValueError) as excinfo:
        build_tools(CONFIG, "github")
    assert "github" in str(excinfo.value)


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
    # instruction carries the authored role and the SDK-injected schema block
    assert "GitHub agent" in prompt
    assert A2UI_SCHEMA_BLOCK_START in prompt
    assert len(a.tools) == 2


def test_stub_tools_are_the_read_only_pair():
    names = {t.__name__ for t in STUB_TOOLS}
    assert names == {"list_pull_requests", "get_pull_request"}
