"""A2A server wiring for the live LLM agent (single-version v0.9.1 card)."""

from __future__ import annotations

from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import AgentCapabilities, AgentCard, AgentSkill
from a2ui.a2a.extension import get_a2ui_agent_extension
from a2ui.schema.constants import VERSION_0_9_1
from starlette.middleware.cors import CORSMiddleware

from catalog_common import supported_catalog_ids

DEFAULT_PORT = 11001
CORS_ORIGIN_REGEX = r"^(http://localhost:\d+|https://[a-z0-9-]+\.[a-z]+\.devtunnels\.ms)$"


def build_agent_card(base_url: str) -> AgentCard:
    # The v0.9.1 extension spec fixes the URI at .../a2ui/v0.9.1 — "the only URI
    # accepted for this extension" — distinct from the v0.9 wire version marker
    # carried inside A2UI messages.
    extension = get_a2ui_agent_extension(
        VERSION_0_9_1,
        accepts_inline_catalogs=False,
        supported_catalog_ids=supported_catalog_ids(),
    )
    capabilities = AgentCapabilities(streaming=True, extensions=[extension])
    skill = AgentSkill(
        id="live_a2ui",
        name="Live A2UI generator",
        description="Generates catalog-conformant Primer A2UI surfaces from natural language over GitHub data.",
        tags=["a2ui", "llm", "github"],
        examples=["What pull requests need my review?"],
    )
    return AgentCard(
        name="Live A2UI Agent",
        description="Live LLM A2A server generating Primer A2UI surfaces (Gemini via ADK).",
        url=base_url,
        version="0.1.0",
        default_input_modes=["text", "text/plain"],
        default_output_modes=["text", "text/plain"],
        capabilities=capabilities,
        skills=[skill],
    )


def build_app(host: str, port: int, base_url: str | None = None):
    # The agent card advertises `base_url` as its service endpoint; set it to a
    # tunnel/proxy URL when the client reaches the server through one. Imports of the
    # ADK-backed responder/executor are deferred here so `build_agent_card` stays
    # importable (and L0-testable) without constructing an LlmAgent.
    from llm_agent.executor import LlmAgentExecutor
    from llm_agent.responder import AdkLlmResponder

    base_url = base_url or f"http://{host}:{port}"
    handler = DefaultRequestHandler(
        agent_executor=LlmAgentExecutor(AdkLlmResponder()),
        task_store=InMemoryTaskStore(),
    )
    server = A2AStarletteApplication(
        agent_card=build_agent_card(base_url), http_handler=handler
    )
    app = server.build()
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=CORS_ORIGIN_REGEX,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    return app
