"""L0 config tests: the per-vendor dataclass is frozen and its defaults hold."""

import dataclasses
from pathlib import Path

import pytest
from a2a.types import AgentSkill

from a2uiverse_kit.config import DEFAULT_MODEL, AgentAppConfig


def _minimal_config(tmp_path: Path) -> AgentAppConfig:
    return AgentAppConfig(
        name="Test Agent",
        description="A test agent.",
        skills=[AgentSkill(id="s1", name="skill", description="d", tags=["t"])],
        default_port=19999,
        responder_app_name="a2ui_test_live",
        adk_agent_name="a2ui_test_live_agent",
        app_dir=tmp_path,
        catalog_path=tmp_path / "catalog.json",
        catalog_kind="basic",
        examples_dir=tmp_path / "examples",
        role_description="role",
        workflow_descriptions=("workflow", "shell", "scope"),
        examples_framing="framing",
        brand_guidance_path=tmp_path / "brand.md",
        domain_knowledge_path=tmp_path / "domain.md",
        build_response=lambda action, surface_id: [],
        build_text_response=lambda prompt, surface_id: [],
        question_policy=lambda payload, metas: None,
    )


def test_config_is_frozen(tmp_path):
    config = _minimal_config(tmp_path)
    with pytest.raises(dataclasses.FrozenInstanceError):
        config.default_port = 1  # type: ignore[misc]


def test_llm_mode_fields_default_off(tmp_path):
    config = _minimal_config(tmp_path)
    assert config.stub_tools == ()
    assert config.live_toolset_factory is None
    assert config.after_tool is None
    assert config.model is None


def test_default_model_is_the_kit_constant():
    assert DEFAULT_MODEL == "gemini-3.7-flash"
