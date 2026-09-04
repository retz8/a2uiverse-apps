"""The mode -> tools mapping and the LlmAgent construction, on this app's config."""

import pytest
from a2ui.schema.constants import A2UI_SCHEMA_BLOCK_START

from a2ui_agent_kit.config import DEFAULT_MODEL
from a2ui_agent_kit.modes import build_llm_agent, build_tools, model_name

from app.config import CONFIG
from app.tools import LIVE_TOOLS, STUB_TOOLS


def test_model_name_defaults_to_the_kit_default(monkeypatch):
    monkeypatch.delenv("MODEL_NAME", raising=False)
    assert model_name(CONFIG) == DEFAULT_MODEL


def test_model_name_reads_env(monkeypatch):
    monkeypatch.setenv("MODEL_NAME", "gemini-1.5-pro")
    assert model_name(CONFIG) == "gemini-1.5-pro"


def test_stub_mode_gives_the_frozen_toolset():
    assert build_tools(CONFIG, "stub") == list(STUB_TOOLS)


def test_live_mode_gives_plain_tools_because_there_is_no_mcp_behind_a_mock():
    # A mock has no vendor: `live` is the model over the tier's dataset (decision 16).
    assert build_tools(CONFIG, "live") == list(LIVE_TOOLS)


def test_the_two_modes_are_not_the_same_tools():
    assert build_tools(CONFIG, "stub") != build_tools(CONFIG, "live")


def test_the_assembled_prompt_carries_the_catalog_schema():
    agent = build_llm_agent(CONFIG, "stub", model="gemini-test")
    prompt = agent.instruction(None)
    assert A2UI_SCHEMA_BLOCK_START in prompt
