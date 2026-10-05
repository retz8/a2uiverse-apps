"""The kit's sign-in front door, over a real server (task-12.9).

The vault is played by Authlib's own OAuth client: a standard client, not one written
against this server. The test app turns sign-in on with two fake accounts and a scope
boundary on one action (`close_issue`) and one tool (`close_issue_tool`).
"""

from __future__ import annotations

import asyncio
import contextlib
import os
import socket
import stat
from html.parser import HTMLParser
from types import SimpleNamespace
from urllib.parse import parse_qs, urlencode, urlsplit

import httpx
import pytest
import uvicorn
from a2a.server.agent_execution import RequestContext
from a2a.server.events import EventQueue
from a2a.types import DataPart, Message, Part, Role, TaskState, TextPart
from authlib.common.security import generate_token
from authlib.integrations.httpx_client import AsyncOAuth2Client
from joserfc import jwt
from joserfc.jwk import KeySet
from starlette.applications import Starlette
from starlette.responses import JSONResponse, RedirectResponse
from starlette.routing import Route

from a2ui_agent_kit import server
from a2ui_agent_kit.executor_llm import LlmAgentExecutor
from a2ui_agent_kit.sign_in import (
    AuthRequired,
    FakeAccount,
    SignedInAccount,
    SignIn,
    UpstreamAccount,
    before_tool_check,
    bind_account,
    current_account,
    require_tool_scopes,
    unbind_account,
)
from a2ui_agent_kit.versions import WIRE_VERSION
from tests.conftest import make_config

REDIRECT = "http://localhost:8765/callback"
SCOPES = {
    "issues.read": "See your issues",
    "issues.write": "Close your issues",
}
FIRST = "openid issues.read"


def _sign_in(**overrides) -> SignIn:
    defaults = dict(
        scopes=SCOPES,
        first_sign_in_scopes=["issues.read"],
        fake_accounts=[
            FakeAccount("ada", {"email": "ada@example.com", "name": "Ada Lovelace"}),
            FakeAccount("alan", {"preferred_username": "alan", "name": "Alan Turing"}),
        ],
        action_scopes={"close_issue": ["issues.write"]},
        tool_scopes={"close_issue_tool": ["issues.write"]},
    )
    defaults.update(overrides)
    return SignIn(**defaults)


def _respond(action: dict) -> list[dict]:
    account = current_account()
    who = (account.claims.get("email") or account.claims.get("name")) if account else None
    return [
        {
            "version": WIRE_VERSION,
            "updateDataModel": {
                "surfaceId": "s",
                "path": "/",
                "value": {"who": who, "action": action.get("name")},
            },
        }
    ]


def _config(tmp_path, sign_in: SignIn | None = None, **overrides):
    overrides.setdefault("build_response", _respond)
    return make_config(
        "basic", tmp_path, sign_in=sign_in if sign_in is not None else _sign_in(), **overrides
    )


def _free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@contextlib.asynccontextmanager
async def _serving(app, port: int):
    uv = uvicorn.Server(
        uvicorn.Config(app, host="127.0.0.1", port=port, log_level="warning", lifespan="off")
    )
    serving = asyncio.create_task(uv.serve())
    while not uv.started:
        await asyncio.sleep(0.01)
    try:
        yield
    finally:
        uv.should_exit = True
        await serving


class Agent:
    """A running test agent and a vault's view of it."""

    def __init__(self, base: str, http: httpx.AsyncClient, state_dir):
        self.base = base
        self.http = http
        self.state_dir = state_dir

    async def metadata(self) -> dict:
        return (await self.http.get("/.well-known/oauth-authorization-server")).json()

    async def register(self, **metadata) -> str:
        body = {
            "redirect_uris": [REDIRECT],
            "token_endpoint_auth_method": "none",
            "grant_types": ["authorization_code", "refresh_token"],
            "response_types": ["code"],
            "client_name": "Test vault",
            **metadata,
        }
        response = await self.http.post("/oauth/register", json=body)
        assert response.status_code == 201, response.text
        return response.json()["client_id"]

    def client(self, client_id: str, scope: str = FIRST) -> AsyncOAuth2Client:
        return AsyncOAuth2Client(
            client_id=client_id,
            redirect_uri=REDIRECT,
            scope=scope,
            code_challenge_method="S256",
            token_endpoint_auth_method="none",
        )

    async def authorize(self, client_id: str, scope: str = FIRST, **params):
        """Starts a sign-in; returns (the first response, the verifier, the state)."""
        verifier = generate_token(48)
        async with self.client(client_id, scope) as vault:
            url, state = vault.create_authorization_url(
                f"{self.base}/oauth/authorize", code_verifier=verifier, **params
            )
        return await self.http.get(url), verifier, state

    async def sign_in(self, client_id: str, scope: str = FIRST, account: str | None = "ada", **params):
        """A whole sign-in through the real flow; the token response."""
        if account is not None:
            params[FAKE_ACCOUNT] = account
        response, verifier, state = await self.authorize(client_id, scope, **params)
        if response.status_code == 200:  # the chooser
            response = await self.choose(response, "ada")
        return await self.exchange(client_id, response, verifier, state, scope)

    async def choose(self, page: httpx.Response, account: str) -> httpx.Response:
        form = _Form.read(page.text)
        return await self.http.post(form.action, data={"pending": form.pending, "account": account})

    async def exchange(self, client_id, response, verifier, state, scope=FIRST) -> dict:
        assert response.status_code == 302, response.text
        location = response.headers["location"]
        assert location.startswith(REDIRECT), location
        async with self.client(client_id, scope) as vault:
            return await vault.fetch_token(
                f"{self.base}/oauth/token",
                authorization_response=location,
                code_verifier=verifier,
                state=state,
            )

    async def refresh(self, client_id: str, refresh_token: str) -> httpx.Response:
        return await self.http.post(
            "/oauth/token",
            data={"grant_type": "refresh_token", "refresh_token": refresh_token, "client_id": client_id},
        )

    async def revoke(self, client_id: str, token: str) -> httpx.Response:
        return await self.http.post("/oauth/revoke", data={"token": token, "client_id": client_id})

    async def send(self, action: str, token: str | None) -> httpx.Response:
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        message = {
            "message": {
                "kind": "message",
                "messageId": generate_token(8),
                "role": "user",
                "parts": [
                    {
                        "kind": "data",
                        "data": {"version": WIRE_VERSION, "action": {"name": action, "surfaceId": "s"}},
                    }
                ],
            }
        }
        rpc = {"jsonrpc": "2.0", "id": "1", "method": "message/send", "params": message}
        return await self.http.post("/", json=rpc, headers=headers)

    async def jwks(self) -> KeySet:
        return KeySet.import_key_set((await self.http.get("/oauth/jwks")).json())


FAKE_ACCOUNT = "fake_account"


class _Form(HTMLParser):
    def __init__(self):
        super().__init__()
        self.action, self.pending, self.accounts = "", "", []

    @classmethod
    def read(cls, html: str) -> _Form:
        form = cls()
        form.feed(html)
        return form

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "form":
            self.action = attrs["action"]
        elif tag == "input" and attrs.get("name") == "pending":
            self.pending = attrs["value"]
        elif tag == "button":
            self.accounts.append(attrs["value"])


@contextlib.asynccontextmanager
async def running(tmp_path, mode="deterministic", config=None, state_dir=None, **build):
    port = _free_port()
    base = f"http://127.0.0.1:{port}"
    config = config or _config(tmp_path)
    state_dir = state_dir or tmp_path / "state"
    resolve = server.resolve_executor
    if mode == "live":  # the sign-in is under test, not the model: answer deterministically
        from a2ui_agent_kit.executor_deterministic import DeterministicAgentExecutor

        executor = DeterministicAgentExecutor(
            config.build_response, config.build_text_response, config.sign_in
        )
        server.resolve_executor = lambda _config, _mode: executor
    try:
        app = server.build_app(
            config, mode, "127.0.0.1", port, base, state_dir=state_dir, **build
        )
    finally:
        server.resolve_executor = resolve
    async with _serving(app, port):
        async with httpx.AsyncClient(base_url=base, timeout=10) as http:
            yield Agent(base, http, state_dir)


def _result(response: httpx.Response) -> dict:
    body = response.json()
    assert "result" in body, body
    return body["result"]


# ---- the card and the metadata ---------------------------------------------------------


async def test_the_card_declares_one_oauth2_scheme_and_the_first_sign_in(tmp_path):
    async with running(tmp_path) as agent:
        card = (await agent.http.get("/.well-known/agent-card.json")).json()
    scheme = card["securitySchemes"]["signIn"]
    assert scheme["type"] == "oauth2"
    flow = scheme["flows"]["authorizationCode"]
    assert flow["authorizationUrl"] == f"{agent.base}/oauth/authorize"
    assert flow["tokenUrl"] == flow["refreshUrl"] == f"{agent.base}/oauth/token"
    assert flow["scopes"] == SCOPES
    assert scheme["oauth2MetadataUrl"] == f"{agent.base}/.well-known/oauth-authorization-server"
    assert card["security"] == [{"signIn": ["issues.read"]}]


async def test_the_metadata_advertises_openid_both_registrations_and_s256(tmp_path):
    async with running(tmp_path) as agent:
        meta = await agent.metadata()
        assert (await agent.http.get("/.well-known/openid-configuration")).json() == meta
    assert meta["issuer"] == agent.base
    assert meta["scopes_supported"] == ["openid", "issues.read", "issues.write"]
    assert meta["code_challenge_methods_supported"] == ["S256"]
    assert meta["token_endpoint_auth_methods_supported"] == ["none"]
    assert meta["registration_endpoint"] == f"{agent.base}/oauth/register"
    assert meta["client_id_metadata_document_supported"] is True
    assert meta["id_token_signing_alg_values_supported"] == ["ES256"]


async def test_an_app_without_sign_in_is_unchanged(tmp_path):
    config = make_config("basic", tmp_path, build_response=_respond)
    port = _free_port()
    app = server.build_app(config, "deterministic", "127.0.0.1", port)
    async with _serving(app, port):
        agent = Agent(f"http://127.0.0.1:{port}", httpx.AsyncClient(base_url=f"http://127.0.0.1:{port}"), None)
        async with agent.http:
            card = (await agent.http.get("/.well-known/agent-card.json")).json()
            assert "securitySchemes" not in card and "security" not in card
            assert (await agent.http.get("/oauth/authorize")).status_code == 404
            result = _result(await agent.send("list_issues", None))
            assert result["status"]["state"] == "completed"
    assert not (tmp_path / ".state").exists()


def test_sign_in_is_checked_where_it_is_declared():
    with pytest.raises(ValueError, match="undeclared"):
        _sign_in(action_scopes={"x": ["nope"]})
    with pytest.raises(ValueError, match="openid"):
        _sign_in(scopes={"openid": "Who you are"})
    with pytest.raises(ValueError, match="fake account"):
        _sign_in(fake_accounts=[])


def test_live_mode_with_sign_in_needs_an_upstream(tmp_path):
    with pytest.raises(ValueError, match="upstream"):
        server.build_app(_config(tmp_path), "live", "127.0.0.1", 1, state_dir=tmp_path / "s")


# ---- registration ---------------------------------------------------------------------


async def test_dynamic_registration_takes_public_clients_only(tmp_path):
    async with running(tmp_path) as agent:
        client_id = await agent.register()
        assert client_id
        refused = await agent.http.post(
            "/oauth/register",
            json={"redirect_uris": [REDIRECT], "token_endpoint_auth_method": "client_secret_basic"},
        )
    assert refused.status_code == 400
    assert refused.json()["error"] == "invalid_client_metadata"


async def test_a_client_id_metadata_document_signs_in(tmp_path):
    doc_port = _free_port()
    client_id = f"http://localhost:{doc_port}/client.json"
    document = {"client_id": client_id, "client_name": "Test vault", "redirect_uris": [REDIRECT]}
    docs = Starlette(routes=[Route("/client.json", lambda r: JSONResponse(document))])
    async with _serving(docs, doc_port), running(tmp_path) as agent:
        token = await agent.sign_in(client_id)
        assert token["access_token"]
        assert _result(await agent.send("list_issues", token["access_token"]))["status"]["state"] == "completed"


async def test_a_client_id_url_off_https_and_off_localhost_is_refused(tmp_path):
    async with running(tmp_path) as agent:
        response, _, _ = await agent.authorize("http://example.com/client.json")
    assert response.status_code == 400
    assert "This sign-in link" in response.text


# ---- signing in -------------------------------------------------------------------------


async def test_the_chooser_offers_every_fake_account_and_signs_in_the_pressed_one(tmp_path):
    async with running(tmp_path) as agent:
        client_id = await agent.register()
        page, verifier, state = await agent.authorize(client_id)
        assert page.status_code == 200
        assert "Choose an account" in page.text and "to continue to Test Agent" in page.text
        assert page.headers["x-frame-options"] == "DENY"
        form = _Form.read(page.text)
        assert form.accounts == ["ada", "alan"]
        token = await agent.exchange(client_id, await agent.choose(page, "ada"), verifier, state)
        result = _result(await agent.send("list_issues", token["access_token"]))
    assert result["status"]["state"] == "completed"
    assert result["status"]["message"]["parts"][0]["data"]["updateDataModel"]["value"]["who"] == "ada@example.com"


async def test_the_non_interactive_entry_signs_in_without_the_chooser(tmp_path):
    async with running(tmp_path) as agent:
        client_id = await agent.register()
        response, _, _ = await agent.authorize(client_id, fake_account="alan")
        assert response.status_code == 302
        token = await agent.sign_in(client_id, account="alan")
        result = _result(await agent.send("list_issues", token["access_token"]))
    assert result["status"]["message"]["parts"][0]["data"]["updateDataModel"]["value"]["who"] == "Alan Turing"


async def test_pkce_is_required_and_s256_only(tmp_path):
    async with running(tmp_path) as agent:
        client_id = await agent.register()
        params = {
            "response_type": "code",
            "client_id": client_id,
            "redirect_uri": REDIRECT,
            "scope": FIRST,
            "state": "xyz",
            "fake_account": "ada",
        }
        missing = await agent.http.get(f"/oauth/authorize?{urlencode(params)}")
        plain = await agent.http.get(
            f"/oauth/authorize?{urlencode({**params, 'code_challenge': 'a' * 43, 'code_challenge_method': 'plain'})}"
        )
    for response in (missing, plain):
        assert response.status_code == 302
        query = parse_qs(urlsplit(response.headers["location"]).query)
        assert query["error"] == ["invalid_request"] and query["state"] == ["xyz"]


async def test_the_redirect_uri_must_match_exactly(tmp_path):
    async with running(tmp_path) as agent:
        client_id = await agent.register()
        verifier = generate_token(48)
        async with AsyncOAuth2Client(
            client_id=client_id, redirect_uri=REDIRECT + "/extra", scope=FIRST, code_challenge_method="S256"
        ) as vault:
            url, _ = vault.create_authorization_url(f"{agent.base}/oauth/authorize", code_verifier=verifier)
        response = await agent.http.get(url)
    assert response.status_code == 400  # never redirected to an address the client did not register


async def test_the_id_token_carries_the_minted_sub_and_the_display_claims(tmp_path):
    async with running(tmp_path) as agent:
        client_id = await agent.register()
        first = await agent.sign_in(client_id)
        again = await agent.sign_in(client_id)
        other = await agent.sign_in(client_id, account="alan")
        keys = await agent.jwks()
    claims = jwt.decode(first["id_token"], keys).claims
    assert claims["iss"] == agent.base and claims["aud"] == [client_id]
    assert claims["email"] == "ada@example.com" and claims["name"] == "Ada Lovelace"
    assert claims["sub"] not in {"ada", "ada@example.com"}  # minted, not the account's id
    assert jwt.decode(again["id_token"], keys).claims["sub"] == claims["sub"]
    alan = jwt.decode(other["id_token"], keys).claims
    assert alan["sub"] != claims["sub"] and alan["preferred_username"] == "alan"
    assert "email" not in alan


# ---- the token in use ----------------------------------------------------------------


async def test_a_request_without_a_live_token_is_answered_401(tmp_path):
    async with running(tmp_path, access_token_lifetime=1) as agent:
        client_id = await agent.register()
        token = (await agent.sign_in(client_id))["access_token"]
        none = await agent.send("list_issues", None)
        wrong = await agent.send("list_issues", "not-a-token")
        assert (await agent.send("list_issues", token)).status_code == 200
        await asyncio.sleep(1.2)
        expired = await agent.send("list_issues", token)
        card = await agent.http.get("/.well-known/agent-card.json")
    assert none.status_code == 401 and none.headers["www-authenticate"] == "Bearer"
    for response in (wrong, expired):
        assert response.status_code == 401
        assert response.headers["www-authenticate"] == 'Bearer error="invalid_token"'
    assert card.status_code == 200


async def test_refresh_rotates_and_a_reused_refresh_token_ends_the_sign_in(tmp_path):
    async with running(tmp_path) as agent:
        client_id = await agent.register()
        first = await agent.sign_in(client_id)
        assert first["expires_in"] == 3600
        rotated = (await agent.refresh(client_id, first["refresh_token"])).json()
        assert rotated["refresh_token"] != first["refresh_token"]
        assert (await agent.send("list_issues", rotated["access_token"])).status_code == 200

        reused = await agent.refresh(client_id, first["refresh_token"])
        assert reused.status_code == 400 and reused.json()["error"] == "invalid_grant"
        assert (await agent.send("list_issues", rotated["access_token"])).status_code == 401
        assert (await agent.refresh(client_id, rotated["refresh_token"])).status_code == 400


async def test_the_dev_setting_shortens_the_access_token(tmp_path):
    async with running(tmp_path, access_token_lifetime=5) as agent:
        token = await agent.sign_in(await agent.register())
    assert token["expires_in"] == 5


# ---- escalation ------------------------------------------------------------------------


async def test_an_action_needing_a_scope_ends_the_run_asking_for_it(tmp_path):
    async with running(tmp_path) as agent:
        client_id = await agent.register()
        token = await agent.sign_in(client_id)
        result = _result(await agent.send("close_issue", token["access_token"]))
    status = result["status"]
    assert status["state"] == "auth-required"
    parts = status["message"]["parts"]
    assert [p["kind"] for p in parts] == ["text", "data"]
    assert parts[0]["text"] == "More access is needed: Close your issues."
    assert parts[1]["data"] == {"security": [{"signIn": ["issues.write"]}]}


async def test_escalation_binds_the_account_and_grants_the_union(tmp_path):
    async with running(tmp_path) as agent:
        client_id = await agent.register()
        first = await agent.sign_in(client_id)
        sub = jwt.decode(first["id_token"], await agent.jwks()).claims["sub"]

        # Deterministic mode goes straight to the hinted account; the vault asks only
        # for what is missing.
        response, verifier, state = await agent.authorize(
            client_id, "openid issues.write", login_hint=sub
        )
        assert response.status_code == 302
        escalated = await agent.exchange(client_id, response, verifier, state, "openid issues.write")
        assert set(escalated["scope"].split()) == {"openid", "issues.read", "issues.write"}
        assert jwt.decode(escalated["id_token"], await agent.jwks()).claims["sub"] == sub
        result = _result(await agent.send("close_issue", escalated["access_token"]))
        assert result["status"]["state"] == "completed"
        # The superseded sign-in's token is gone with it.
        assert (await agent.send("list_issues", first["access_token"])).status_code == 401

        mismatch, _, _ = await agent.authorize(client_id, login_hint=sub, fake_account="alan")
        unknown, _, _ = await agent.authorize(client_id, login_hint="nobody", fake_account="ada")
    assert parse_qs(urlsplit(mismatch.headers["location"]).query)["error"] == ["access_denied"]
    assert parse_qs(urlsplit(unknown.headers["location"]).query)["error"] == ["invalid_request"]


def _bound(sign_in: SignIn, scopes):
    account = SignedInAccount("sub-1", "ada", {"email": "ada@example.com"}, frozenset(scopes))
    context = SimpleNamespace(call_context=SimpleNamespace(state={"auth": account}))
    return bind_account(context, sign_in)


def test_a_tool_needing_a_scope_is_stopped_before_it_runs():
    token = _bound(_sign_in(), {"issues.read"})
    try:
        before_tool_check(tool=SimpleNamespace(name="list_issues_tool"), args={}, tool_context=None)
        with pytest.raises(AuthRequired) as raised:
            before_tool_check(tool=SimpleNamespace(name="close_issue_tool"), args={}, tool_context=None)
        assert raised.value.missing == ("issues.write",)
    finally:
        unbind_account(token)
    require_tool_scopes("close_issue_tool")  # without sign-in nothing is checked


class _ScopeBoundaryResponder:
    """A model run that reaches the scope-bound tool after some prose."""

    async def stream(self, prompt, correction=None, context_id=None):
        yield "Closing it now. "
        require_tool_scopes("close_issue_tool")
        yield "done"


async def test_the_llm_executor_ends_a_run_at_the_scope_boundary(tmp_path):
    config = _config(tmp_path)
    executor = LlmAgentExecutor(_ScopeBoundaryResponder(), config)
    account = SignedInAccount("sub-1", "ada", {}, frozenset({"issues.read"}))
    message = Message(
        message_id="m", role=Role.user, parts=[Part(root=TextPart(text="close #4"))], kind="message"
    )
    context = RequestContext(request=SimpleNamespace(message=message, configuration=None, metadata=None))
    context._call_context = SimpleNamespace(state={"auth": account}, activated_extensions=set(), requested_extensions=set())
    queue = EventQueue()
    await executor.execute(context, queue)
    events = []
    while not queue.queue.empty():
        events.append(await queue.dequeue_event(no_wait=True))
    final = events[-1]
    assert final.status.state == TaskState.auth_required and final.final
    data = [p.root.data for p in final.status.message.parts if isinstance(p.root, DataPart)]
    assert data == [{"security": [{"signIn": ["issues.write"]}]}]


async def test_a_cut_off_run_is_kept_out_of_the_conversation(tmp_path):
    from google.adk.agents import LlmAgent
    from google.adk.models import BaseLlm, LlmResponse
    from google.genai import types

    from a2ui_agent_kit.responder import AdkLlmResponder

    class _Model(BaseLlm):
        async def generate_content_async(self, llm_request, stream=False):
            text = llm_request.contents[-1].parts[0].text or ""
            if "close" in text:
                call = types.FunctionCall(name="close_issue_tool", args={})
                yield LlmResponse(content=types.Content(role="model", parts=[types.Part(function_call=call)]))
            else:
                yield LlmResponse(content=types.Content(role="model", parts=[types.Part(text="Two open.")]))

    def close_issue_tool() -> str:
        """Closes the issue."""
        raise AssertionError("ran without its scope")

    agent = LlmAgent(
        name="t", model=_Model(model="fake"), tools=[close_issue_tool], before_tool_callback=before_tool_check
    )
    responder = AdkLlmResponder(agent, app_name="t")
    token = _bound(_sign_in(), {"issues.read"})
    try:
        assert "".join([c async for c in responder.stream("list them", context_id="c1")]) == "Two open."
        with pytest.raises(AuthRequired):
            async for _ in responder.stream("close #4", context_id="c1"):
                pass
    finally:
        unbind_account(token)
    session = await responder._session_service.get_session(
        app_name="t", user_id="live-user", session_id=responder._sessions["c1"]
    )
    texts = [p.text for e in session.events for p in (e.content.parts if e.content else []) if p.text]
    assert texts == ["list them", "Two open."]


# ---- revocation and the store --------------------------------------------------------------


async def test_any_revoked_token_ends_its_whole_sign_in(tmp_path):
    async with running(tmp_path) as agent:
        client_id = await agent.register()
        for kind in ("access_token", "refresh_token"):
            token = await agent.sign_in(client_id)
            assert (await agent.revoke(client_id, token[kind])).status_code == 200
            assert (await agent.send("list_issues", token["access_token"])).status_code == 401
            assert (await agent.refresh(client_id, token["refresh_token"])).status_code == 400
        assert (await agent.revoke(client_id, "unknown")).status_code == 200  # RFC 7009 §2.2


async def test_the_store_survives_a_restart_and_is_owner_only(tmp_path):
    async with running(tmp_path) as agent:
        client_id = await agent.register()
        token = await agent.sign_in(client_id)
    path = tmp_path / "state" / "sign-in.json"
    assert stat.S_IMODE(os.stat(path).st_mode) == 0o600
    assert stat.S_IMODE(os.stat(tmp_path / "state").st_mode) == 0o700
    assert token["access_token"] not in path.read_text()  # stored by hash
    async with running(tmp_path) as agent:
        assert (await agent.send("list_issues", token["access_token"])).status_code == 200
        assert (await agent.refresh(client_id, token["refresh_token"])).status_code == 200


def test_the_store_defaults_to_a_state_folder_in_the_app(tmp_path):
    assert server.default_state_dir(_config(tmp_path)) == tmp_path / ".state"


# ---- live mode, over a test upstream ----------------------------------------------------------


class _Upstream:
    """A vendor sign-in that signs in whichever account its URL names."""

    def __init__(self):
        self.account = "v-1"
        self.revoked: list[dict] = []

    async def start(self, request, pending):
        return RedirectResponse(f"{pending.finish_url}?{urlencode({'p': pending.id, 'a': self.account})}")

    async def finish(self, request):
        account = request.query_params["a"]
        claims = {"email": f"{account}@vendor.test"}
        return request.query_params["p"], UpstreamAccount(account, claims, {"vendor": f"tok-{account}"})

    async def revoke(self, vendor_token):
        self.revoked.append(dict(vendor_token))


async def test_live_mode_signs_in_through_the_upstream_and_refuses_the_fake_entry(tmp_path):
    upstream = _Upstream()
    seen = []

    def respond(action):
        seen.append(dict(current_account().vendor_token))
        return []

    config = _config(tmp_path, _sign_in(upstream=upstream), build_response=respond)
    async with running(tmp_path, "live", config=config) as agent:
        client_id = await agent.register()
        refused, _, _ = await agent.authorize(client_id, fake_account="ada")
        response, verifier, state = await agent.authorize(client_id)
        assert response.status_code == 307
        finished = await agent.http.get(response.headers["location"])
        token = await agent.exchange(client_id, finished, verifier, state)
        keys = await agent.jwks()
        assert (await agent.send("list_issues", token["access_token"])).status_code == 200
    assert parse_qs(urlsplit(refused.headers["location"]).query)["error"] == ["invalid_request"]
    claims = jwt.decode(token["id_token"], keys).claims
    assert claims["email"] == "v-1@vendor.test"
    assert seen == [{"vendor": "tok-v-1"}]  # the request's account carries its vendor token


async def _live_sign_in(agent: Agent, client_id: str, **params) -> httpx.Response:
    response, verifier, state = await agent.authorize(client_id, **params)
    finished = await agent.http.get(response.headers["location"])
    location = finished.headers.get("location", "")
    if not location.startswith(REDIRECT) or "code" not in parse_qs(urlsplit(location).query):
        return finished
    return await agent.exchange(client_id, finished, verifier, state)


async def test_live_escalation_fails_when_the_vendor_returns_another_account(tmp_path):
    upstream = _Upstream()
    config = _config(tmp_path, _sign_in(upstream=upstream))
    async with running(tmp_path, "live", config=config) as agent:
        client_id = await agent.register()
        first = await _live_sign_in(agent, client_id)
        sub = jwt.decode(first["id_token"], await agent.jwks()).claims["sub"]
        upstream.account = "v-2"
        refused = await _live_sign_in(agent, client_id, login_hint=sub)
    assert refused.status_code == 302
    assert parse_qs(urlsplit(refused.headers["location"]).query)["error"] == ["access_denied"]


async def test_the_vendor_token_is_revoked_when_the_accounts_last_sign_in_ends(tmp_path):
    upstream = _Upstream()
    config = _config(tmp_path, _sign_in(upstream=upstream))
    async with running(tmp_path, "live", config=config) as agent:
        vault_a, vault_b = await agent.register(), await agent.register()
        a = await _live_sign_in(agent, vault_a)
        b = await _live_sign_in(agent, vault_b)
        await agent.revoke(vault_a, a["refresh_token"])
        assert upstream.revoked == []  # another sign-in still uses the vendor token
        assert (await agent.send("list_issues", b["access_token"])).status_code == 200
        await agent.revoke(vault_b, b["access_token"])
    assert upstream.revoked == [{"vendor": "tok-v-1"}]


async def test_a_token_from_one_mode_means_nothing_in_the_other(tmp_path):
    async with running(tmp_path) as agent:
        client_id = await agent.register()
        token = await agent.sign_in(client_id)
    config = _config(tmp_path, _sign_in(upstream=_Upstream()))
    async with running(tmp_path, "live", config=config) as agent:
        assert (await agent.send("list_issues", token["access_token"])).status_code == 401
        assert (await agent.refresh(client_id, token["refresh_token"])).status_code == 400
