"""A2A server wiring: one app, one card, every run mode.

One AgentCard serves all three modes — the run mode is a launch detail, and a card
describing the harness rather than the product would make the Router rank the no-LLM
fan-out demo against a document nothing else matches. The card advertises the v0.9.1
extension in every mode.
"""

from __future__ import annotations

from pathlib import Path

from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.types import AgentCapabilities, AgentCard
from a2ui.a2a.extension import get_a2ui_agent_extension
from a2ui.schema.constants import VERSION_0_9_1
from starlette.middleware.cors import CORSMiddleware

from a2ui_agent_kit.catalog import catalog_context
from a2ui_agent_kit.config import AgentAppConfig
from a2ui_agent_kit.modes import resolve_executor
from a2ui_agent_kit.sign_in import ApiKeySignIn
from a2ui_agent_kit.sign_in_server import (
    ACCESS_TOKEN_LIFETIME,
    ApiKeyGate,
    SignInGate,
    SignInServer,
    api_key_card_security,
    card_security,
)
from a2ui_agent_kit.sign_in_store import SignInStore
from a2ui_agent_kit.task_store import TerminalGuardedTaskStore

CORS_ORIGIN_REGEX = r"^(http://localhost:\d+|https://[a-z0-9-]+\.[a-z]+\.devtunnels\.ms)$"


def build_agent_card(
    config: AgentAppConfig, base_url: str, public_url: str | None = None
) -> AgentCard:
    # The v0.9.1 extension spec fixes the URI at .../a2ui/v0.9.1 — "the only URI
    # accepted for this extension" — distinct from the v0.9 wire version marker
    # carried inside A2UI messages.
    extension = get_a2ui_agent_extension(
        VERSION_0_9_1,
        accepts_inline_catalogs=False,
        supported_catalog_ids=catalog_context(config).supported_catalog_ids(),
    )
    capabilities = AgentCapabilities(streaming=True, extensions=[extension])
    if isinstance(config.sign_in, ApiKeySignIn):
        security_schemes, security = api_key_card_security(config.sign_in)
    elif config.sign_in is not None:
        security_schemes, security = card_security(config.sign_in, base_url, public_url)
    else:
        security_schemes, security = None, None
    return AgentCard(
        name=config.name,
        description=config.description,
        url=base_url,
        version="0.1.0",
        default_input_modes=["text", "text/plain"],
        default_output_modes=["text", "text/plain"],
        capabilities=capabilities,
        skills=list(config.skills),
        security_schemes=security_schemes,
        security=security,
    )


def default_state_dir(config: AgentAppConfig) -> Path:
    """Where the sign-in store lives unless --state-dir moves it (gitignored)."""
    return config.app_dir / ".state"


def build_app(
    config: AgentAppConfig,
    mode: str,
    host: str,
    port: int,
    base_url: str | None = None,
    state_dir: Path | None = None,
    access_token_lifetime: int = ACCESS_TOKEN_LIFETIME,
    public_url: str | None = None,
):
    # The agent card advertises `base_url` as its service endpoint; the A2A client
    # POSTs message/send there. Defaults to the bind address, but must be set to a
    # tunnel/proxy URL when the client reaches the server through one (otherwise the
    # card would advertise an unreachable localhost).
    base_url = base_url or f"http://{host}:{port}"
    handler = DefaultRequestHandler(
        agent_executor=resolve_executor(config, mode),
        task_store=TerminalGuardedTaskStore(),
    )
    server = A2AStarletteApplication(
        agent_card=build_agent_card(config, base_url, public_url), http_handler=handler
    )
    app = server.build()
    if isinstance(config.sign_in, ApiKeySignIn):
        app.add_middleware(ApiKeyGate, sign_in=config.sign_in)
    elif config.sign_in is not None:
        sign_in = SignInServer(
            config=config.sign_in,
            app_name=config.name,
            mode=mode,
            base_url=base_url,
            store=SignInStore(state_dir or default_state_dir(config)),
            access_token_lifetime=access_token_lifetime,
            public_url=public_url,
        )
        app.router.routes.extend(sign_in.routes())
        app.add_middleware(SignInGate, sign_in=sign_in)
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=CORS_ORIGIN_REGEX,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    return app
