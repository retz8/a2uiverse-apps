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
from llm_agent.mcp import MissingGoogleCredentialError


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


def test_stub_backend_gives_the_stub_toolset(monkeypatch):
    monkeypatch.setenv("TOOL_BACKEND", "stub")
    tools = build_tools()
    assert {t.__name__ for t in tools} == {
        "search_threads",
        "get_thread",
        "list_labels",
        "create_draft",
        "label_thread",
        "unlabel_thread",
    }


def test_mcp_backend_gives_the_mcp_toolset(monkeypatch):
    monkeypatch.setenv("TOOL_BACKEND", "mcp")
    monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", "a-project")
    monkeypatch.setattr("llm_agent.mcp.access_token", lambda: "token-value")
    tools = build_tools()
    assert len(tools) == 1
    assert isinstance(tools[0], McpToolset)


def test_mcp_backend_without_a_credential_fails_fast(monkeypatch):
    # Never degrade to canned data: a convincing surface built from stub fixtures with
    # no signal that it is not live is worse than a failure.
    monkeypatch.setenv("TOOL_BACKEND", "mcp")
    monkeypatch.delenv("GOOGLE_CLOUD_PROJECT", raising=False)
    with pytest.raises(MissingGoogleCredentialError):
        build_tools()


def test_unknown_backend_is_rejected(monkeypatch):
    monkeypatch.setenv("TOOL_BACKEND", "gmail")
    with pytest.raises(ValueError) as excinfo:
        build_tools()
    assert "gmail" in str(excinfo.value)


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
    assert "Gmail agent" in prompt
    assert A2UI_SCHEMA_BLOCK_START in prompt
    assert len(a.tools) == len(STUB_TOOLS)


def test_stub_tools_hold_no_destructive_tool():
    # The stub mirrors the admitted MCP surface, so it must not grow a capability the
    # live backend deliberately withholds.
    names = {t.__name__ for t in STUB_TOOLS}
    assert not any("trash" in n or "spam" in n or "send" in n for n in names)
