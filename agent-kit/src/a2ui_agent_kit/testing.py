"""Test harnesses for an app's own tests.

In-process: run an executor and reconstruct its emitted A2UI payload. Over a real
server: `serving` runs the app's agent on a port and signs in to it as a vault would,
for an app that turns sign-in on.

Shipped in the package (not the kit's tests/) so vendor suites import one harness
instead of carrying byte-identical copies. The executor is injected: the kit's own
suite builds one from a fake config's response pair; a vendor suite builds one
from its app's.
"""

from __future__ import annotations

import secrets
from unittest.mock import AsyncMock, MagicMock

from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.types import DataPart, Message, Part, Role, TextPart
from a2ui.a2a.parts import get_a2ui_datapart, is_a2ui_part

from a2ui_agent_kit.versions import WIRE_VERSION


def _incoming_message(action: dict) -> Message:
    return Message(
        message_id="test-msg",
        role=Role.user,
        parts=[Part(root=DataPart(data={"version": WIRE_VERSION, "action": action}))],
        kind="message",
    )


def _incoming_text_message(text: str) -> Message:
    return Message(
        message_id="test-msg",
        role=Role.user,
        parts=[Part(root=TextPart(text=text))],
        kind="message",
    )


def _parts_from_event(event) -> list:
    status = getattr(event, "status", None)
    message = getattr(status, "message", None) if status is not None else None
    return list(getattr(message, "parts", []) or [])


async def _run(executor: AgentExecutor, message: Message) -> list[dict]:
    context = MagicMock(spec=RequestContext)
    context.message = message
    context.current_task = None

    queue = MagicMock(spec=EventQueue)
    queue.enqueue_event = AsyncMock()

    await executor.execute(context, queue)

    payload: list[dict] = []
    for call in queue.enqueue_event.call_args_list:
        event = call.args[0]
        for part in _parts_from_event(event):
            if is_a2ui_part(part):
                payload.append(get_a2ui_datapart(part).data)
    return payload


async def run_executor(executor: AgentExecutor, action: dict) -> list[dict]:
    return await _run(executor, _incoming_message(action))


async def run_executor_text(executor: AgentExecutor, text: str) -> list[dict]:
    return await _run(executor, _incoming_text_message(text))


# ---- signing in, over a real server ------------------------------------------------------

VAULT_REDIRECT = "http://localhost:8765/callback"


def _free_port() -> int:
    import socket

    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


class SignedInAgent:
    """An app's agent running on a port, and a vault's view of it: Authlib's OAuth client
    signing in through the deterministic sign-in's non-interactive entry."""

    def __init__(self, base: str, http):
        self.base = base
        self.http = http

    async def card(self) -> dict:
        return (await self.http.get("/.well-known/agent-card.json")).json()

    async def sign_in(
        self, account: str, scopes: list[str], login_hint: str | None = None
    ) -> dict:
        """A whole sign-in as `account`, asking `scopes`; the token response."""
        from authlib.common.security import generate_token
        from authlib.integrations.httpx_client import AsyncOAuth2Client

        body = {
            "redirect_uris": [VAULT_REDIRECT],
            "token_endpoint_auth_method": "none",
            "grant_types": ["authorization_code", "refresh_token"],
            "response_types": ["code"],
        }
        client_id = (await self.http.post("/oauth/register", json=body)).json()["client_id"]
        scope = " ".join(["openid", *scopes])
        verifier = generate_token(48)
        params = {"fake_account": account, **({"login_hint": login_hint} if login_hint else {})}
        async with AsyncOAuth2Client(
            client_id=client_id,
            redirect_uri=VAULT_REDIRECT,
            scope=scope,
            code_challenge_method="S256",
            token_endpoint_auth_method="none",
        ) as vault:
            url, state = vault.create_authorization_url(
                f"{self.base}/oauth/authorize", code_verifier=verifier, **params
            )
            response = await self.http.get(url)
            assert response.status_code == 302, response.text
            return await vault.fetch_token(
                f"{self.base}/oauth/token",
                authorization_response=response.headers["location"],
                code_verifier=verifier,
                state=state,
            )

    async def sub(self, token: dict) -> str:
        from joserfc import jwt
        from joserfc.jwk import KeySet

        keys = KeySet.import_key_set((await self.http.get("/oauth/jwks")).json())
        return jwt.decode(token["id_token"], keys).claims["sub"]

    async def send(self, part: dict, headers: dict[str, str] | None = None):
        """One `message/send` carrying `part`; the HTTP response."""
        message = {
            "kind": "message",
            "messageId": secrets.token_hex(8),
            "role": "user",
            "parts": [part],
        }
        rpc = {"jsonrpc": "2.0", "id": "1", "method": "message/send", "params": {"message": message}}
        return await self.http.post("/", json=rpc, headers=headers or {})

    async def send_action(self, name: str, token: str | None, context: dict | None = None):
        action = {"name": name, "surfaceId": "s", "context": context or {}}
        data = {"kind": "data", "data": {"version": WIRE_VERSION, "action": action}}
        return await self.send(data, {"Authorization": f"Bearer {token}"} if token else {})

    async def send_text(self, text: str, token: str | None):
        part = {"kind": "text", "text": text}
        return await self.send(part, {"Authorization": f"Bearer {token}"} if token else {})


def task_state(response) -> str:
    """The state a `message/send` answer ended in."""
    body = response.json()
    assert "result" in body, body
    return body["result"]["status"]["state"]


def requested_access(response) -> list[dict]:
    """The `security` an `auth-required` answer asks for."""
    parts = response.json()["result"]["status"]["message"]["parts"]
    return [p["data"]["security"] for p in parts if p.get("kind") == "data"]


def serving(config, mode: str = "deterministic", state_dir=None):
    """Runs the app's agent on a free port for the length of an `async with`, yielding a
    `SignedInAgent`."""
    import asyncio
    import contextlib

    import httpx
    import uvicorn

    from a2ui_agent_kit.server import build_app

    @contextlib.asynccontextmanager
    async def run():
        port = _free_port()
        base = f"http://127.0.0.1:{port}"
        app = build_app(config, mode, "127.0.0.1", port, base, state_dir=state_dir)
        server = uvicorn.Server(
            uvicorn.Config(app, host="127.0.0.1", port=port, log_level="warning", lifespan="off")
        )
        task = asyncio.create_task(server.serve())
        while not server.started:
            await asyncio.sleep(0.01)
        try:
            async with httpx.AsyncClient(base_url=base, timeout=20) as http:
                yield SignedInAgent(base, http)
        finally:
            server.should_exit = True
            await task

    return run()


def serve_unauthorized():
    """A local stand-in for a vendor's MCP server that refuses every token with 401, for
    the length of an `async with`, yielding its URL."""
    import asyncio
    import contextlib

    import uvicorn
    from starlette.applications import Starlette
    from starlette.responses import JSONResponse
    from starlette.routing import Route

    async def refuse(request):
        return JSONResponse(
            {"error": "invalid_token"}, status_code=401, headers={"WWW-Authenticate": "Bearer"}
        )

    @contextlib.asynccontextmanager
    async def run():
        port = _free_port()
        app = Starlette(routes=[Route("/mcp", refuse, methods=["GET", "POST", "DELETE"])])
        server = uvicorn.Server(
            uvicorn.Config(app, host="127.0.0.1", port=port, log_level="warning", lifespan="off")
        )
        task = asyncio.create_task(server.serve())
        while not server.started:
            await asyncio.sleep(0.01)
        try:
            yield f"http://127.0.0.1:{port}/mcp"
        finally:
            server.should_exit = True
            await task

    return run()


def stored_secrets(state_dir) -> list[str]:
    """Every secret an agent's sign-in store holds in the clear — the vendor tokens and its
    own client secret at the vendor — for a corpus guard to look for. Empty without a
    store."""
    import json
    from pathlib import Path

    path = Path(state_dir) / "sign-in.json"
    if not path.is_file():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    found = [
        value
        for account in data.get("accounts", {}).values()
        for key in ("access_token", "refresh_token")
        if (value := (account.get("vendor_token") or {}).get(key))
    ]
    client = (data.get("upstream") or {}).get("vendor_client") or {}
    if client.get("client_secret"):
        found.append(client["client_secret"])
    return [value for value in found if len(value) >= 16]
