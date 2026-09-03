"""A2A server wiring: one app, one card, every run mode.

One AgentCard serves all three modes — the run mode is a launch detail, and a card
describing the harness rather than the product would make the Router rank the no-LLM
fan-out demo against a document nothing else matches. The card advertises the v0.9.1
extension in every mode.
"""

from __future__ import annotations

from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import AgentCapabilities, AgentCard
from a2ui.a2a.extension import get_a2ui_agent_extension
from a2ui.schema.constants import VERSION_0_9_1
from starlette.middleware.cors import CORSMiddleware

from a2ui_agent_kit.catalog import catalog_context
from a2ui_agent_kit.config import AgentAppConfig
from a2ui_agent_kit.modes import resolve_executor

CORS_ORIGIN_REGEX = r"^(http://localhost:\d+|https://[a-z0-9-]+\.[a-z]+\.devtunnels\.ms)$"


def build_agent_card(config: AgentAppConfig, base_url: str) -> AgentCard:
    # The v0.9.1 extension spec fixes the URI at .../a2ui/v0.9.1 — "the only URI
    # accepted for this extension" — distinct from the v0.9 wire version marker
    # carried inside A2UI messages.
    extension = get_a2ui_agent_extension(
        VERSION_0_9_1,
        accepts_inline_catalogs=False,
        supported_catalog_ids=catalog_context(config).supported_catalog_ids(),
    )
    capabilities = AgentCapabilities(streaming=True, extensions=[extension])
    return AgentCard(
        name=config.name,
        description=config.description,
        url=base_url,
        version="0.1.0",
        default_input_modes=["text", "text/plain"],
        default_output_modes=["text", "text/plain"],
        capabilities=capabilities,
        skills=list(config.skills),
    )


def build_app(
    config: AgentAppConfig, mode: str, host: str, port: int, base_url: str | None = None
):
    # The agent card advertises `base_url` as its service endpoint; the A2A client
    # POSTs message/send there. Defaults to the bind address, but must be set to a
    # tunnel/proxy URL when the client reaches the server through one (otherwise the
    # card would advertise an unreachable localhost).
    base_url = base_url or f"http://{host}:{port}"
    handler = DefaultRequestHandler(
        agent_executor=resolve_executor(config, mode),
        task_store=InMemoryTaskStore(),
    )
    server = A2AStarletteApplication(
        agent_card=build_agent_card(config, base_url), http_handler=handler
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
