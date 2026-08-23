import pytest
from a2ui.schema.constants import A2UI_SCHEMA_BLOCK_START
from google.adk.tools.mcp_tool import McpToolset

from llm_agent.agent import (
    DEFAULT_BACKEND,
    DEFAULT_MODEL,
    STUB_TOOLS,
    build_llm_agent,
    build_tools,
    model_name,
    tool_backend,
)
from llm_agent.mcp import PAT_ENV_VAR, MissingGitHubPatError


def test_model_name_defaults_to_cheap_tier(monkeypatch):
    monkeypatch.delenv("MODEL_NAME", raising=False)
    assert model_name() == DEFAULT_MODEL


def test_model_name_reads_env(monkeypatch):
    monkeypatch.setenv("MODEL_NAME", "gemini-1.5-pro")
    assert model_name() == "gemini-1.5-pro"


def test_backend_defaults_to_mcp(monkeypatch):
    # Live is the default so the stub is always a deliberate choice: an
    # accidentally-stubbed verification run is silently wrong, whereas an
    # accidental live run costs only a few API calls.
    monkeypatch.delenv("TOOL_BACKEND", raising=False)
    assert tool_backend() == DEFAULT_BACKEND == "mcp"


def test_backend_reads_env(monkeypatch):
    monkeypatch.setenv("TOOL_BACKEND", "stub")
    assert tool_backend() == "stub"


def test_stub_backend_gives_the_read_only_pair(monkeypatch):
    monkeypatch.setenv("TOOL_BACKEND", "stub")
    tools = build_tools()
    assert {t.__name__ for t in tools} == {"list_pull_requests", "get_pull_request"}


def test_mcp_backend_gives_the_mcp_toolset(monkeypatch):
    monkeypatch.setenv("TOOL_BACKEND", "mcp")
    monkeypatch.setenv(PAT_ENV_VAR, "ghp_example")
    tools = build_tools()
    assert len(tools) == 1
    assert isinstance(tools[0], McpToolset)


def test_mcp_backend_without_pat_fails_fast(monkeypatch):
    monkeypatch.setenv("TOOL_BACKEND", "mcp")
    monkeypatch.delenv(PAT_ENV_VAR, raising=False)
    with pytest.raises(MissingGitHubPatError):
        build_tools()


def test_unknown_backend_is_rejected(monkeypatch):
    monkeypatch.setenv("TOOL_BACKEND", "github")
    with pytest.raises(ValueError) as excinfo:
        build_tools()
    assert "github" in str(excinfo.value)


def test_backend_choice_is_logged(monkeypatch, caplog):
    monkeypatch.setenv("TOOL_BACKEND", "stub")
    with caplog.at_level("INFO", logger="llm_agent.agent"):
        build_tools()
    assert "stub" in caplog.text


def test_build_llm_agent_wires_prompt_and_tools(monkeypatch):
    monkeypatch.setenv("TOOL_BACKEND", "stub")
    a = build_llm_agent(model="gemini-2.5-flash")
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
