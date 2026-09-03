"""The GitHub app's kit config — the whole per-vendor surface, stated once."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from a2ui_agent_kit.config import AgentAppConfig
from a2ui_agent_kit.paint_meta import require_root_component

from app import prose
from app.card import APP_DESCRIPTION, APP_NAME, SKILLS
from app.responses import build_response, build_text_response
from app.tool_shaping import record_shape, shape_tool_response
from app.tools import STUB_TOOLS

_AGENT_DIR = Path(__file__).resolve().parents[1]  # github/agent/
_APP_PKG = Path(__file__).resolve().parent  # github/agent/app/


def _live_toolset():
    # Deferred: app.mcp pulls google.adk, which deterministic and stub runs must
    # never pay for.
    from app.mcp import build_github_toolset

    return build_github_toolset()


def _after_tool(tool_name: str, tool_response: Any) -> Any:
    # The kit's normalized hook carries (tool_name, tool_response); record_shape's
    # args parameter is passed empty, so the env-gated shape dump loses only the
    # sorted arg names.
    record_shape(tool_name, {}, tool_response)
    return shape_tool_response(tool_response, tool_name)


CONFIG = AgentAppConfig(
    name=APP_NAME,
    description=APP_DESCRIPTION,
    skills=SKILLS,
    default_port=11001,
    responder_app_name="a2ui_github_live",
    adk_agent_name="a2ui_github_live_agent",
    app_dir=_AGENT_DIR,
    catalog_path=_AGENT_DIR.parents[0]
    / "github-catalog"
    / "catalogs"
    / "v0.9.1"
    / "catalog.json",
    catalog_kind="custom",
    examples_dir=_APP_PKG / "knowledge" / "examples",
    role_description=prose.ROLE_DESCRIPTION,
    workflow_descriptions=(
        prose.WORKFLOW_DESCRIPTION,
        prose.SHELL_DESCRIPTION,
        prose.SCOPE_DESCRIPTION,
    ),
    examples_framing=prose.EXAMPLES_FRAMING,
    brand_guidance_path=_APP_PKG / "knowledge" / "brand-guidance.md",
    domain_knowledge_path=_APP_PKG / "knowledge" / "github-domain.md",
    build_response=build_response,
    build_text_response=build_text_response,
    question_policy=require_root_component("ConfirmationDialog"),
    stub_tools=STUB_TOOLS,
    live_toolset_factory=_live_toolset,
    after_tool=_after_tool,
)
