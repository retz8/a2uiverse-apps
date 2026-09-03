"""Kit test fixtures: minimal vendor-neutral configs over the two authored catalogs.

The kit's suite imports no vendor app. Each config points at one of the two fixture
catalogs — `basic` (allOf-composed, id-required) and `custom` (top-level props, id
unmodeled) — so both `catalog_kind` branches and both named question policies run
against the same machinery.
"""

from __future__ import annotations

from pathlib import Path

import pytest
from a2a.types import AgentSkill

from a2ui_agent_kit.config import AgentAppConfig

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"


def _question_policy_for(kind: str):
    # The kit-shipped named policies land with paint_meta; until then the fake
    # configs carry a pass-through so catalog/prompt tests can run.
    try:
        from a2ui_agent_kit import paint_meta
    except ImportError:  # pragma: no cover
        return lambda payload, metas: None
    if kind == "basic":
        return paint_meta.require_carries_action
    return paint_meta.require_root_component("ConfirmationDialog")


def make_config(kind: str, tmp_path: Path, **overrides) -> AgentAppConfig:
    defaults = dict(
        name="Test Agent",
        description="A vendor-neutral test agent.",
        skills=[
            AgentSkill(
                id="test-skill",
                name="Test skill",
                description="Answers test requests.",
                tags=["test"],
                examples=["What needs my attention today?"],
            )
        ],
        default_port=19999,
        responder_app_name="a2ui_test_live",
        adk_agent_name="a2ui_test_live_agent",
        app_dir=tmp_path,
        catalog_path=FIXTURES_DIR / f"catalog-{kind}.json",
        catalog_kind=kind,
        examples_dir=FIXTURES_DIR / f"examples-{kind}",
        role_description="You are a test agent.",
        workflow_descriptions=("Fetch, then compose one surface.", "Title every paint."),
        examples_framing="The examples below demonstrate composition idioms.",
        brand_guidance_path=FIXTURES_DIR / "knowledge" / "brand-guidance.md",
        domain_knowledge_path=FIXTURES_DIR / "knowledge" / "test-domain.md",
        build_response=lambda action, surface_id: [],
        build_text_response=lambda prompt, surface_id: [],
        question_policy=_question_policy_for(kind),
    )
    defaults.update(overrides)
    return AgentAppConfig(**defaults)


@pytest.fixture
def basic_config(tmp_path) -> AgentAppConfig:
    return make_config("basic", tmp_path)


@pytest.fixture
def custom_config(tmp_path) -> AgentAppConfig:
    return make_config("custom", tmp_path)


@pytest.fixture(params=["basic", "custom"])
def any_config(request, tmp_path) -> AgentAppConfig:
    return make_config(request.param, tmp_path)
