"""A2A server wiring for the deterministic agent."""

from __future__ import annotations

from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import AgentCapabilities, AgentCard, AgentSkill
from a2ui.a2a.extension import get_a2ui_agent_extension
from a2ui.schema.constants import VERSION_0_9
from starlette.middleware.cors import CORSMiddleware

from deterministic_agent.catalog import supported_catalog_ids
from deterministic_agent.executor import DeterministicAgentExecutor

DEFAULT_PORT = 11001
CORS_ORIGIN_REGEX = r"^(http://localhost:\d+|https://[a-z0-9-]+\.[a-z]+\.devtunnels\.ms)$"


def build_agent_card(base_url: str) -> AgentCard:
    extension = get_a2ui_agent_extension(
        VERSION_0_9,
        accepts_inline_catalogs=False,
        supported_catalog_ids=supported_catalog_ids(),
    )
    capabilities = AgentCapabilities(streaming=True, extensions=[extension])
    skill = AgentSkill(
        id="canned_a2ui",
        name="Canned A2UI responder",
        description="Returns a fixed, catalog-conformant A2UI surface for known UI events.",
        tags=["a2ui", "deterministic"],
        examples=["submit"],
    )
    return AgentCard(
        name="Deterministic A2UI Agent",
        description="Deterministic Phase 2 A2A server returning canned A2UI (no LLM).",
        url=base_url,
        version="0.1.0",
        default_input_modes=["text", "text/plain"],
        default_output_modes=["text", "text/plain"],
        capabilities=capabilities,
        skills=[skill],
    )


def build_app(host: str, port: int, base_url: str | None = None):
    # The agent card advertises `base_url` as its service endpoint; the A2A client
    # POSTs message/send there. Defaults to the bind address, but must be set to a
    # tunnel/proxy URL when the client reaches the server through one (otherwise the
    # card would advertise an unreachable localhost).
    base_url = base_url or f"http://{host}:{port}"
    handler = DefaultRequestHandler(
        agent_executor=DeterministicAgentExecutor(),
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
