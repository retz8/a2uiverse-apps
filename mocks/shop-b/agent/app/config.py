"""The Shop B app's kit config — the whole per-vendor surface, stated once.

Everything the kit needs from this app is on this one object: identity, port, paths,
prompt prose, and the callables behind the three run modes. The kit never discovers a
config; `app/__main__.py` hands it this one.
"""

from __future__ import annotations

from pathlib import Path

from a2ui_agent_kit.config import AgentAppConfig
from a2ui_agent_kit.paint_meta import require_carries_action

from app import prose
from app.card import APP_DESCRIPTION, APP_NAME, SKILLS
from app.responses import build_response, build_text_response
from app.tools import LIVE_TOOLS, STUB_TOOLS

_AGENT_DIR = Path(__file__).resolve().parents[1]  # shop-b/agent/
_APP_PKG = Path(__file__).resolve().parent  # shop-b/agent/app/


def _live_tools():
    # A mock has no MCP behind it: `live` is the model over the tier's dataset, with
    # tools that keep what they change (task-4.6 decisions 13 and 16). No deferral is
    # needed — nothing here imports ADK.
    return LIVE_TOOLS


CONFIG = AgentAppConfig(
    name=APP_NAME,
    description=APP_DESCRIPTION,
    skills=SKILLS,
    default_port=12002,
    responder_app_name="a2ui_shop_b_live",
    adk_agent_name="a2ui_shop_b_live_agent",
    app_dir=_AGENT_DIR,
    catalog_path=_AGENT_DIR.parent / "shop-b-catalog" / "catalogs" / "v0.9.1" / "catalog.json",
    catalog_kind="basic",
    examples_dir=_APP_PKG / "knowledge" / "examples",
    role_description=prose.ROLE_DESCRIPTION,
    workflow_descriptions=(
        prose.SURFACE_DESCRIPTION,
        prose.WORKFLOW_DESCRIPTION,
        prose.SHELL_DESCRIPTION,
        prose.SCOPE_DESCRIPTION,
    ),
    examples_framing=prose.EXAMPLES_FRAMING,
    brand_guidance_path=_APP_PKG / "knowledge" / "brand-guidance.md",
    domain_knowledge_path=_APP_PKG / "knowledge" / "shop-b-domain.md",
    build_response=build_response,
    build_text_response=build_text_response,
    question_policy=require_carries_action,
    stub_tools=STUB_TOOLS,
    live_toolset_factory=_live_tools,
)
