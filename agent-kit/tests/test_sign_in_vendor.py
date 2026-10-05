"""The vendor OAuth upstream and the API-key sign-in (task-12.10 decisions 1, 2 and 7).

The vendor is a fake authorization server on a port of its own; the agent runs in live
mode over it, and the vault is Authlib's client, as in the kit's sign-in tests.
"""

from __future__ import annotations

import base64
import contextlib
import hashlib
import json
import secrets
import time
from types import SimpleNamespace
from urllib.parse import parse_qs, urlencode, urlsplit

import httpx
import pytest
from a2a.server.agent_execution import RequestContext
from a2a.server.events import EventQueue
from a2a.types import Message, Part, Role, TaskState, TextPart
from joserfc import jwt
from joserfc.jwk import KeySet, OctKey
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse, RedirectResponse, Response
from starlette.routing import Route

from a2ui_agent_kit import server
from a2ui_agent_kit.executor_llm import LlmAgentExecutor
from a2ui_agent_kit.sign_in import (
    ApiKeySignIn,
    FakeAccount,
    SignedInAccount,
    VendorSignInEnded,
    current_account,
)
from a2ui_agent_kit.sign_in_store import SignInStore
from a2ui_agent_kit.sign_in_vendor import ClientFromEnv, VendorOAuth, id_token_claims
from a2ui_agent_kit.toolset import PolicyMcpToolset, is_unauthorized
from a2ui_agent_kit.versions import WIRE_VERSION
from tests.conftest import make_config
from tests.test_sign_in import REDIRECT, Agent, _config, _free_port, _serving, _sign_in, running


class FakeVendor:
    """A vendor's authorization server: registration, sign-in that approves at once,
    PKCE-checked code exchange, refresh, revocation, and a `/me` for identity."""

    def __init__(self, base: str, secret: str | None = None):
        self.base = base
        self.secret = secret
        self.account = "u-1"
        self.expires_in = 3600
        self.refresh_ok = True
        self.grant_less = False
        self.clients: dict[str, dict] = {}
        self.codes: dict[str, dict] = {}
        self.tokens: dict[str, dict] = {}
        self.refresh_tokens: dict[str, dict] = {}
        self.asked: list[dict] = []
        self.registrations = 0
        self.refreshes = 0
        self.revoked: list[dict] = []

    def metadata(self) -> dict:
        return {
            "issuer": self.base,
            "authorization_endpoint": f"{self.base}/authorize",
            "token_endpoint": f"{self.base}/token",
            "registration_endpoint": f"{self.base}/register",
            "revocation_endpoint": f"{self.base}/revoke",
        }

    async def _metadata(self, request: Request) -> Response:
        return JSONResponse(self.metadata())

    async def _register(self, request: Request) -> Response:
        body = await request.json()
        assert body["token_endpoint_auth_method"] == "none"
        self.registrations += 1
        client_id = f"dyn-{self.registrations}"
        self.clients[client_id] = {"redirect_uris": body["redirect_uris"]}
        return JSONResponse({"client_id": client_id, **body}, status_code=201)

    async def _authorize(self, request: Request) -> Response:
        q = dict(request.query_params)
        self.asked.append(q)
        client = self.clients.get(q["client_id"])
        assert client is not None and q["redirect_uri"] in client["redirect_uris"]
        assert q["code_challenge_method"] == "S256"
        code = secrets.token_urlsafe(8)
        self.codes[code] = {**q, "account": self.account}
        return RedirectResponse(f"{q['redirect_uri']}?{urlencode({'code': code, 'state': q['state']})}")

    def _issue(self, account: str, scope: str, client_id: str) -> dict:
        access, refresh = secrets.token_urlsafe(8), secrets.token_urlsafe(8)
        self.tokens[access] = {"account": account}
        self.refresh_tokens[refresh] = {"account": account, "scope": scope, "client_id": client_id}
        granted = "read" if self.grant_less else scope
        id_token = jwt.encode(
            {"alg": "HS256"},
            {"sub": account, "aud": client_id, "iss": self.base, "exp": int(time.time()) + 300},
            OctKey.import_key("k" * 32),
        )
        return {
            "access_token": access,
            "token_type": "bearer",
            "expires_in": self.expires_in,
            "refresh_token": refresh,
            "scope": granted,
            "id_token": id_token,
        }

    async def _token(self, request: Request) -> Response:
        form = dict(await request.form())
        client_id = form.get("client_id")
        if self.secret is not None and form.get("client_secret") != self.secret:
            return JSONResponse({"error": "invalid_client"}, status_code=401)
        if form["grant_type"] == "authorization_code":
            code = self.codes.pop(form["code"], None)
            if code is None or code["client_id"] != client_id or code["redirect_uri"] != form["redirect_uri"]:
                return JSONResponse({"error": "invalid_grant"}, status_code=400)
            digest = hashlib.sha256(form["code_verifier"].encode()).digest()
            challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
            if challenge != code["code_challenge"]:
                return JSONResponse({"error": "invalid_grant"}, status_code=400)
            return JSONResponse(self._issue(code["account"], code["scope"], client_id))
        if form["grant_type"] == "refresh_token":
            self.refreshes += 1
            held = self.refresh_tokens.pop(form["refresh_token"], None)
            if not self.refresh_ok or held is None:
                return JSONResponse({"error": "invalid_grant"}, status_code=400)
            return JSONResponse(self._issue(held["account"], held["scope"], client_id))
        return JSONResponse({"error": "unsupported_grant_type"}, status_code=400)

    async def _revoke(self, request: Request) -> Response:
        self.revoked.append(dict(await request.form()))
        return Response(status_code=200)

    async def _me(self, request: Request) -> Response:
        token = request.headers.get("authorization", "").removeprefix("Bearer ")
        held = self.tokens.get(token)
        if held is None:
            return JSONResponse({"error": "invalid_token"}, status_code=401)
        return JSONResponse({"id": held["account"], "email": f"{held['account']}@vendor.test"})

    def app(self) -> Starlette:
        return Starlette(
            routes=[
                Route("/.well-known/oauth-authorization-server", self._metadata),
                Route("/register", self._register, methods=["POST"]),
                Route("/authorize", self._authorize),
                Route("/token", self._token, methods=["POST"]),
                Route("/revoke", self._revoke, methods=["POST"]),
                Route("/me", self._me),
            ]
        )


async def _identify(token, http: httpx.AsyncClient):
    me = (await http.get(VENDOR["me"], headers={"Authorization": f"Bearer {token['access_token']}"})).json()
    return me["id"], {"email": me["email"]}


VENDOR: dict[str, str] = {}

VENDOR_SCOPES = {"issues.read": ["read"], "issues.write": ["write"]}


def _upstream(vendor: FakeVendor, **overrides) -> VendorOAuth:
    VENDOR["me"] = f"{vendor.base}/me"
    options = dict(
        vendor="Vendor",
        scopes=VENDOR_SCOPES,
        identity_scopes=["profile"],
        identify=_identify,
        metadata_url=f"{vendor.base}/.well-known/oauth-authorization-server",
    )
    options.update(overrides)
    return VendorOAuth(**options)


@contextlib.asynccontextmanager
async def vendor_and_agent(tmp_path, *, secret=None, seen=None, build=None, **upstream):
    port = _free_port()
    vendor = FakeVendor(f"http://127.0.0.1:{port}", secret=secret)
    seen = seen if seen is not None else []

    def respond(action):
        seen.append(dict(current_account().vendor_token or {}))
        return []

    config = _config(tmp_path, _sign_in(upstream=_upstream(vendor, **upstream)), build_response=respond)
    async with _serving(vendor.app(), port):
        async with running(tmp_path, "live", config=config, **(build or {})) as agent:
            yield vendor, agent, seen


async def _sign_in_live(agent: Agent, client_id: str, scope="openid issues.read", **params):
    """The vault's sign-in through the agent and on to the vendor and back; the agent's
    token response, or the response the sign-in stopped at."""
    response, verifier, state = await agent.authorize(client_id, scope, **params)
    for _ in range(4):
        location = response.headers.get("location", "")
        if response.status_code not in (302, 303, 307) or location.startswith(REDIRECT):
            break
        response = await agent.http.get(location)
    location = response.headers.get("location", "")
    if not location.startswith(REDIRECT) or "code" not in parse_qs(urlsplit(location).query):
        return response
    return await agent.exchange(client_id, response, verifier, state, scope)


# ---- signing in at the vendor -----------------------------------------------------------


async def test_the_agent_registers_itself_signs_in_at_the_vendor_and_keeps_the_token(tmp_path):
    async with vendor_and_agent(tmp_path) as (vendor, agent, seen):
        client_id = await agent.register()
        token = await _sign_in_live(agent, client_id)
        claims = jwt.decode(token["id_token"], await agent.jwks()).claims
        assert (await agent.send("list_issues", token["access_token"])).status_code == 200
        again = await _sign_in_live(agent, await agent.register())
    assert vendor.registrations == 1  # kept in the store, used again
    asked = vendor.asked[0]
    assert asked["redirect_uri"] == f"{agent.base}/sign-in/finish"
    assert asked["scope"] == "read profile"
    assert claims["email"] == "u-1@vendor.test"
    assert jwt.decode(again["id_token"], await _jwks(tmp_path)).claims["sub"] == claims["sub"]
    held = seen[0]
    assert held["access_token"] in vendor.tokens and held["client_id"] == "dyn-1"
    assert "id_token" not in held and held["expires_at"] > time.time()
    store = json.loads((agent.state_dir / "sign-in.json").read_text())
    assert store["upstream"]["vendor_client"]["client_id"] == "dyn-1"


async def _jwks(tmp_path) -> KeySet:
    return KeySet.import_key_set(SignInStore(tmp_path / "state").public_jwks())


async def test_a_client_registered_by_hand_signs_in_with_its_secret(tmp_path, monkeypatch):
    monkeypatch.setenv("VENDOR_CLIENT_ID", "by-hand")
    monkeypatch.setenv("VENDOR_CLIENT_SECRET", "s3cret")
    client = ClientFromEnv("VENDOR_CLIENT_ID", "VENDOR_CLIENT_SECRET")
    async with vendor_and_agent(tmp_path, secret="s3cret", client=client) as (vendor, agent, _):
        vendor.clients["by-hand"] = {"redirect_uris": [f"{agent.base}/sign-in/finish"]}
        token = await _sign_in_live(agent, await agent.register())
    assert "access_token" in token
    assert vendor.registrations == 0


async def test_a_vendor_client_missing_from_the_env_shows_a_plain_page(tmp_path, monkeypatch):
    monkeypatch.delenv("VENDOR_CLIENT_ID", raising=False)
    client = ClientFromEnv("VENDOR_CLIENT_ID", "VENDOR_CLIENT_SECRET")
    async with vendor_and_agent(tmp_path, client=client) as (vendor, agent, _):
        response = await _sign_in_live(agent, await agent.register())
    assert response.status_code == 400
    assert "available right now" in response.text
    assert "VENDOR_CLIENT_ID" not in response.text


async def test_escalation_asks_the_vendor_for_what_the_account_now_grants(tmp_path):
    async with vendor_and_agent(tmp_path) as (vendor, agent, _):
        client_id = await agent.register()
        first = await _sign_in_live(agent, client_id)
        sub = jwt.decode(first["id_token"], await agent.jwks()).claims["sub"]
        more = await _sign_in_live(agent, client_id, "openid issues.write", login_hint=sub)
    assert vendor.asked[1]["scope"] == "read write profile"
    assert set(more["scope"].split()) == {"openid", "issues.read", "issues.write"}


async def test_a_vendor_granting_less_than_asked_does_not_sign_in(tmp_path):
    async with vendor_and_agent(tmp_path) as (vendor, agent, _):
        vendor.grant_less = True
        client_id = await agent.register()
        first = await _sign_in_live(agent, client_id)
        sub = jwt.decode(first["id_token"], await agent.jwks()).claims["sub"]
        refused = await _sign_in_live(agent, client_id, "openid issues.write", login_hint=sub)
    assert refused.status_code == 400 and "didn" in refused.text


async def test_an_id_token_is_read_for_the_agents_client_only():
    def token(aud, exp=None):
        payload = {"sub": "s", "aud": aud, "iss": "https://v", "exp": exp or time.time() + 60}
        raw = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
        return {"id_token": f"h.{raw}.s", "client_id": "me"}

    assert id_token_claims(token("me"), ["https://v"])["sub"] == "s"
    for bad in (token("other"), token("me", exp=time.time() - 5)):
        with pytest.raises(Exception):
            id_token_claims(bad, ["https://v"])


# ---- refresh, the end of the vendor's token, revocation ------------------------------------------


async def test_a_vendor_token_near_its_expiry_is_refreshed_before_the_request(tmp_path):
    async with vendor_and_agent(tmp_path) as (vendor, agent, seen):
        vendor.expires_in = 60  # inside the refresh margin
        token = await _sign_in_live(agent, await agent.register())
        first = dict((await _held(agent)))
        assert (await agent.send("list_issues", token["access_token"])).status_code == 200
    assert vendor.refreshes == 1
    assert seen[0]["access_token"] != first["access_token"]
    assert seen[0]["access_token"] in vendor.tokens


async def _held(agent: Agent) -> dict:
    store = json.loads((agent.state_dir / "sign-in.json").read_text())
    return next(a["vendor_token"] for a in store["accounts"].values())


async def test_a_vendor_token_that_cannot_be_refreshed_ends_the_accounts_sign_ins(tmp_path):
    async with vendor_and_agent(tmp_path, build={"access_token_lifetime": 3600}) as (vendor, agent, _):
        vendor.expires_in = 0
        vendor.refresh_ok = False
        client_id = await agent.register()
        token = await _sign_in_live(agent, client_id)
        refused = await agent.send("list_issues", token["access_token"])
        refresh = await agent.refresh(client_id, token["refresh_token"])
    assert refused.status_code == 401
    assert 'error="invalid_token"' in refused.headers["www-authenticate"]
    assert refresh.status_code == 400
    assert vendor.revoked  # best-effort, the vendor told


async def test_the_vendor_token_is_revoked_at_the_vendor_when_the_last_sign_in_ends(tmp_path):
    async with vendor_and_agent(tmp_path) as (vendor, agent, _):
        client_id = await agent.register()
        token = await _sign_in_live(agent, client_id)
        refresh = next(iter(vendor.refresh_tokens))
        await agent.revoke(client_id, token["access_token"])
    assert vendor.revoked == [
        {"token": refresh, "token_type_hint": "refresh_token", "client_id": "dyn-1"}
    ]


async def test_a_vendor_401_in_a_run_fails_it_and_ends_the_accounts_sign_ins(tmp_path):
    class _Refused:
        async def stream(self, prompt, correction=None, context_id=None):
            yield "Looking. "
            raise VendorSignInEnded("refused")

    ended = []

    async def end():
        ended.append(True)

    executor = LlmAgentExecutor(_Refused(), _config(tmp_path))
    account = SignedInAccount("sub-1", "ada", {}, frozenset({"issues.read"}), end_sign_ins=end)
    message = Message(message_id="m", role=Role.user, parts=[Part(root=TextPart(text="hi"))], kind="message")
    context = RequestContext(request=SimpleNamespace(message=message, configuration=None, metadata=None))
    context._call_context = SimpleNamespace(
        state={"auth": account}, activated_extensions=set(), requested_extensions=set()
    )
    queue = EventQueue()
    await executor.execute(context, queue)
    events = []
    while not queue.queue.empty():
        events.append(await queue.dequeue_event(no_wait=True))
    final = events[-1]
    assert final.status.state == TaskState.failed and final.final
    assert final.status.message.parts[0].root.text == (
        "Your Test Agent sign-in has ended. Sign in again to continue."
    )
    assert ended == [True]


async def test_a_vendors_401_on_listing_its_tools_is_the_end_of_its_token():
    from google.adk.tools.mcp_tool import StreamableHTTPConnectionParams

    async def deny(request):
        return JSONResponse({"error": "invalid_token"}, status_code=401)

    port = _free_port()
    async with _serving(Starlette(routes=[Route("/mcp", deny, methods=["GET", "POST", "DELETE"])]), port):
        toolset = PolicyMcpToolset(
            connection_params=StreamableHTTPConnectionParams(url=f"http://127.0.0.1:{port}/mcp", timeout=5)
        )
        with pytest.raises(VendorSignInEnded):
            await toolset.get_tools()
    request = httpx.Request("GET", "http://x")
    error = httpx.HTTPStatusError("no", request=request, response=httpx.Response(403, request=request))
    assert not is_unauthorized(ConnectionError("x"))
    assert not is_unauthorized(error)


# ---- the API-key sign-in ---------------------------------------------------------------------------

KEYS = ApiKeySignIn(
    header="X-Shop-Key",
    description="Your Shop key, from Account settings.",
    keys={"demo-key-1": FakeAccount("shopper", {"name": "Demo shopper"})},
)


def _send(action: str) -> dict:
    return {
        "jsonrpc": "2.0",
        "id": "1",
        "method": "message/send",
        "params": {
            "message": {
                "kind": "message",
                "messageId": secrets.token_hex(4),
                "role": "user",
                "parts": [
                    {"kind": "data", "data": {"version": WIRE_VERSION, "action": {"name": action, "surfaceId": "s"}}}
                ],
            }
        },
    }


async def test_an_api_key_sign_in_declares_its_scheme_and_lets_only_its_keys_in(tmp_path):
    seen = []

    def respond(action):
        seen.append(current_account().claims["name"])
        return []

    config = make_config("basic", tmp_path, sign_in=KEYS, build_response=respond)
    port = _free_port()
    base = f"http://127.0.0.1:{port}"
    app = server.build_app(config, "deterministic", "127.0.0.1", port, base)
    async with _serving(app, port):
        async with httpx.AsyncClient(base_url=base) as http:
            card = (await http.get("/.well-known/agent-card.json")).json()
            none = await http.post("/", json=_send("browse"))
            wrong = await http.post("/", json=_send("browse"), headers={"X-Shop-Key": "nope"})
            right = await http.post("/", json=_send("browse"), headers={"X-Shop-Key": "demo-key-1"})
            routes = await http.get("/.well-known/oauth-authorization-server")
    assert card["securitySchemes"] == {
        "apiKey": {
            "type": "apiKey",
            "in": "header",
            "name": "X-Shop-Key",
            "description": "Your Shop key, from Account settings.",
        }
    }
    assert card["security"] == [{"apiKey": []}]
    assert none.status_code == 401 and wrong.status_code == 401
    assert right.status_code == 200 and "result" in right.json()
    assert seen == ["Demo shopper"]
    assert routes.status_code == 404  # no OAuth routes


def test_an_api_key_sign_in_needs_a_header_and_a_key():
    with pytest.raises(ValueError):
        ApiKeySignIn(header="", description="d", keys={"k": FakeAccount("a", {})})
    with pytest.raises(ValueError):
        ApiKeySignIn(header="X-Key", description="d", keys={})


def test_a_tool_its_server_does_not_mark_read_only_needs_the_unmarked_scopes():
    from a2ui_agent_kit.sign_in import AuthRequired, bind_account, before_tool_check, unbind_account

    sign_in = _sign_in(unmarked_tool_scopes=["issues.write"])
    account = SignedInAccount("sub-1", "ada", {}, frozenset({"issues.read"}))
    token = bind_account(SimpleNamespace(call_context=SimpleNamespace(state={"auth": account})), sign_in)

    def tool(name, read_only):
        annotations = SimpleNamespace(readOnlyHint=read_only)
        return SimpleNamespace(name=name, _mcp_tool=SimpleNamespace(annotations=annotations))

    try:
        before_tool_check(tool=tool("get_issue", True), args={}, tool_context=None)
        before_tool_check(tool=SimpleNamespace(name="stub_tool"), args={}, tool_context=None)
        for unmarked in (tool("merge", False), tool("comment", None)):
            with pytest.raises(AuthRequired):
                before_tool_check(tool=unmarked, args={}, tool_context=None)
    finally:
        unbind_account(token)
