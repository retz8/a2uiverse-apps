"""A2A server wiring: one app, one card, every run mode, six paths.

One AgentCard serves all three modes — the run mode is a launch detail, and a card
describing the harness rather than the product would make the Router rank the no-LLM
fan-out demo against a document nothing else matches. The card advertises one A2UI
extension entry per version the app speaks, in every mode.

The agent answers A2A 1.0 and 0.3 over JSON-RPC, HTTP+JSON and gRPC, its card listing the six
paths in the order the app's config writes them (a2uiverse task-20.9 decisions 6 to 9). One
request handler of the Python A2A SDK serves them all. The four HTTP paths answer on the app's
one HTTP port: JSON-RPC at the base URL itself and HTTP+JSON under `/rest`, each taking both
A2A versions. gRPC answers both on a port of its own, listed on the card as a bare
`host:port`, and runs for as long as the HTTP app does, gRPC's port reuse off, so a taken gRPC
port stops the app as a taken HTTP port does. The card is served by the SDK's own card route, in A2A 1.0's
shape with A2A 0.3's fields merged in.
"""

from __future__ import annotations

import contextlib
import logging
from pathlib import Path
from urllib.parse import urlsplit

import grpc
from a2a.compat.v0_3 import a2a_v0_3_pb2_grpc
from a2a.compat.v0_3.grpc_handler import CompatGrpcHandler
from a2a.server.request_handlers import DefaultRequestHandler, GrpcHandler
from a2a.server.routes import (
    create_agent_card_routes,
    create_jsonrpc_routes,
    create_rest_routes,
)
from a2a.types import (
    AgentCapabilities,
    AgentCard,
    AgentExtension,
    AgentInterface,
    a2a_pb2_grpc,
)
from starlette.applications import Starlette
from starlette.middleware.cors import CORSMiddleware

from a2ui_agent_kit.bindings import GRPC, HTTP_JSON, Interface
from a2ui_agent_kit.card_signing import CardSigner
from a2ui_agent_kit.catalog_lines import catalog_lines
from a2ui_agent_kit.config import AgentAppConfig
from a2ui_agent_kit.gates import (
    BearerCredentials,
    Credentials,
    GrpcAccountContextBuilder,
    GrpcGate,
    HttpGate,
    KeyCredentials,
)
from a2ui_agent_kit.modes import resolve_executor
from a2ui_agent_kit.sign_in import ApiKeySignIn, SignedInAccount
from a2ui_agent_kit.sign_in_server import (
    ACCESS_TOKEN_LIFETIME,
    SignInServer,
    api_key_card_security,
    card_security,
)
from a2ui_agent_kit.sign_in_store import SignInStore
from a2ui_agent_kit.task_store import TerminalGuardedTaskStore
from a2ui_agent_kit.versions import a2ui_extension

logger = logging.getLogger(__name__)

CORS_ORIGIN_REGEX = r"^(http://localhost:\d+|https://[a-z0-9-]+\.[a-z]+\.devtunnels\.ms)$"

# JSON-RPC answers at the base URL itself, HTTP+JSON under this prefix (a2uiverse task-20.9).
RPC_PATH = "/"
REST_PREFIX = "/rest"
DEFAULT_MODES = ["text", "text/plain"]
# gRPC turns port reuse on by default; off, a port another process holds fails the bind.
GRPC_SERVER_OPTIONS = [("grpc.so_reuseport", 0)]


def a2ui_extensions(config: AgentAppConfig) -> list[AgentExtension]:
    """The card's A2UI entries: one per version the app speaks, oldest first, each naming the
    app's catalog ids, as upstream's card helper writes them (a2uiverse task-19.4).

    Each version's extension spec fixes its own URI, `.../a2ui/v0.9` and `.../a2ui/v0.9.1`.
    The params stay flat, as upstream's helper writes them, except on a v0.9.1-only app,
    whose params are keyed under `v0.9.1`. The ids are the current catalog id and, beside
    it, an old one the app still paints in (a2uiverse task-15.7).
    """
    ids = catalog_lines(config).ids()
    keyed = config.a2ui_versions == ("v0.9.1",)
    return [a2ui_extension(version, ids, keyed=keyed) for version in config.a2ui_versions]


def interface_url(interface: Interface, base_url: str, grpc_address: str) -> str:
    """Where the card says a path answers."""
    if interface.binding == GRPC:
        return grpc_address
    if interface.binding == HTTP_JSON:
        return f"{base_url.rstrip('/')}{REST_PREFIX}"
    return base_url


def build_agent_card(
    config: AgentAppConfig,
    base_url: str,
    public_url: str | None = None,
    *,
    grpc_address: str | None = None,
) -> AgentCard:
    """The app's public card, unsigned. Its gRPC interfaces are listed at `grpc_address`, by
    default the base URL's host at the config's gRPC port."""
    grpc_address = grpc_address or f"{urlsplit(base_url).hostname}:{config.default_grpc_port}"
    capabilities = AgentCapabilities(streaming=True, extensions=a2ui_extensions(config))
    if config.account_skills is not None:
        capabilities.extended_agent_card = True
    if isinstance(config.sign_in, ApiKeySignIn):
        security_schemes, security_requirements = api_key_card_security(config.sign_in)
    elif config.sign_in is not None:
        security_schemes, security_requirements = card_security(
            config.sign_in, base_url, public_url
        )
    else:
        security_schemes, security_requirements = {}, []
    card = AgentCard(
        name=config.name,
        description=config.description,
        version=config.version,
        supported_interfaces=[
            AgentInterface(
                url=interface_url(interface, base_url, grpc_address),
                protocol_binding=interface.binding,
                protocol_version=interface.version,
            )
            for interface in config.interfaces
        ],
        default_input_modes=DEFAULT_MODES,
        default_output_modes=DEFAULT_MODES,
        capabilities=capabilities,
        skills=list(config.skills),
        security_schemes=security_schemes,
        security_requirements=security_requirements,
    )
    if config.provider is not None:
        card.provider.CopyFrom(config.provider)
    if config.documentation_url is not None:
        card.documentation_url = config.documentation_url
    return card


def account_card(public: AgentCard, skills) -> AgentCard:
    """An account's card: the public card with the account's skills in place of its own."""
    card = AgentCard()
    card.CopyFrom(public)
    del card.signatures[:]
    del card.skills[:]
    card.skills.extend(skills)
    return card


def default_state_dir(config: AgentAppConfig) -> Path:
    """Where the sign-in store and the card's key live unless --state-dir moves them
    (gitignored)."""
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
    grpc_port: int | None = None,
) -> Starlette:
    # The card advertises `base_url` for its HTTP interfaces. Defaults to the bind address,
    # but must be set to a tunnel/proxy URL when the client reaches the server through one
    # (otherwise the card would advertise an unreachable localhost).
    base_url = base_url or f"http://{host}:{port}"
    grpc_port = grpc_port if grpc_port is not None else config.default_grpc_port
    grpc_address = f"{host}:{grpc_port}"
    state_dir = state_dir or default_state_dir(config)
    # The executor chooses each request's version against the card the app serves.
    card = build_agent_card(config, base_url, public_url, grpc_address=grpc_address)
    signer = CardSigner(state_dir, base_url) if config.sign_card else None
    served = signer.sign(card) if signer is not None else card

    sign_in: SignInServer | None = None
    credentials: Credentials | None = None
    if isinstance(config.sign_in, ApiKeySignIn):
        credentials = KeyCredentials(config.sign_in)
    elif config.sign_in is not None:
        sign_in = SignInServer(
            config=config.sign_in,
            app_name=config.name,
            mode=mode,
            base_url=base_url,
            store=SignInStore(state_dir),
            access_token_lifetime=access_token_lifetime,
            public_url=public_url,
        )
        credentials = BearerCredentials(sign_in)

    extended: dict = {}
    if config.account_skills is not None:

        async def own_card(_card: AgentCard, call_context) -> AgentCard:
            account = call_context.state.get("auth")
            if not isinstance(account, SignedInAccount):
                return served
            own = account_card(card, config.account_skills(account))
            return signer.sign(own) if signer is not None else own

        extended = {"extended_agent_card": card, "extended_card_modifier": own_card}

    handler = DefaultRequestHandler(
        agent_executor=resolve_executor(config, mode, card),
        task_store=TerminalGuardedTaskStore(),
        agent_card=served,
        **extended,
    )

    @contextlib.asynccontextmanager
    async def serve_grpc(_app):
        server = grpc.aio.server(
            interceptors=[GrpcGate(credentials)] if credentials is not None else None,
            options=GRPC_SERVER_OPTIONS,
        )
        context_builder = GrpcAccountContextBuilder()
        a2a_pb2_grpc.add_A2AServiceServicer_to_server(
            GrpcHandler(handler, context_builder=context_builder), server
        )
        a2a_v0_3_pb2_grpc.add_A2AServiceServicer_to_server(
            CompatGrpcHandler(handler, context_builder=context_builder), server
        )
        server.add_insecure_port(grpc_address)
        await server.start()
        logger.info("gRPC answering on %s", grpc_address)
        try:
            yield
        finally:
            await server.stop(grace=1)

    routes = [
        *create_agent_card_routes(served),
        *(signer.routes() if signer is not None else ()),
        *(sign_in.routes() if sign_in is not None else ()),
        *create_jsonrpc_routes(handler, RPC_PATH, enable_v0_3_compat=True),
        # Last: HTTP+JSON's routes end with a catch-all for a tenant prefix.
        *create_rest_routes(handler, enable_v0_3_compat=True, path_prefix=REST_PREFIX),
    ]
    app = Starlette(routes=routes, lifespan=serve_grpc)
    if credentials is not None:
        app.add_middleware(
            HttpGate, credentials=credentials, rpc_path=RPC_PATH, rest_prefix=REST_PREFIX
        )
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=CORS_ORIGIN_REGEX,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    return app
