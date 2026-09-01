"""The per-vendor config: everything an app supplies to run on the kit.

One frozen dataclass, instantiated once per app (in its `app/config.py`) and handed
to the kit CLI explicitly. It carries the app's data (identity, port, paths, prompt
prose) and its callables (deterministic response pair, stub tools, live toolset
factory, question policy, after-tool hook). The kit never discovers a config — it is
handed one.
"""

from __future__ import annotations

from collections.abc import Callable, Sequence
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Literal

from a2a.types import AgentSkill

# Overridable per app via `AgentAppConfig.model`, and at runtime via MODEL_NAME. Not
# the lite tier — it could not reliably emit a well-formed surface at this payload size.
DEFAULT_MODEL = "gemini-3.7-flash"

CatalogKind = Literal["custom", "basic"]

# (action, surface_id) -> A2UI message list — the deterministic executor's contract.
BuildResponse = Callable[[dict, str], list[dict]]
# (prompt, surface_id) -> A2UI message list.
BuildTextResponse = Callable[[str, str], list[dict]]
# (payload, metas-by-surfaceId) -> None, raising on an invalid declared question
# (see paint_meta's named policies).
QuestionPolicy = Callable[[list[dict], dict[str, dict]], None]
# (tool_name, tool_response) -> shaped response, or None to pass through.
AfterTool = Callable[[str, Any], Any]


# eq=False keeps identity semantics: a config instance IS the app, and identity
# hashing lets the kit cache per-config state (catalog context) directly on it.
@dataclass(frozen=True, eq=False)
class AgentAppConfig:
    """The whole per-vendor surface of a kit-run agent."""

    # Identity / wiring
    name: str  # AgentCard name
    description: str
    skills: Sequence[AgentSkill]
    default_port: int  # manual-run fallback; launched runs pass --port explicitly
    responder_app_name: str  # ADK Runner app_name, e.g. "a2ui_gmail_live"
    adk_agent_name: str  # ADK LlmAgent name, e.g. "a2ui_gmail_live_agent"
    app_dir: Path  # agent project root: anchors .env and the debug dumps

    # Catalog
    catalog_path: Path  # explicit path to the checked-in catalog.json
    catalog_kind: CatalogKind
    examples_dir: Path  # curated example surfaces fed to the schema manager

    # Prompt
    role_description: str
    workflow_descriptions: Sequence[str]  # joined, with the domain doc appended last
    examples_framing: str
    brand_guidance_path: Path
    domain_knowledge_path: Path

    # Deterministic mode
    build_response: BuildResponse
    build_text_response: BuildTextResponse

    # LLM modes
    question_policy: QuestionPolicy
    stub_tools: Sequence[Callable] = field(default_factory=tuple)
    live_toolset_factory: Callable[[], Any] | None = None
    after_tool: AfterTool | None = None
    model: str | None = None  # None -> kit DEFAULT_MODEL (MODEL_NAME env still wins)
