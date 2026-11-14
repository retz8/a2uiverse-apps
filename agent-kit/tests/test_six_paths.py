"""A kit agent over real sockets on each of the six paths, driven by the Python A2A SDK's own
client (a2uiverse task-20.9 decision 21, item 2): JSON-RPC, HTTP+JSON and gRPC, each at A2A 1.0
and at A2A 0.3.

Each request reaches one path: the client is handed the card the agent serves with that one
interface listed, so the SDK's own choice of interface does not pick for it.
"""

from __future__ import annotations

import contextlib
import secrets

import grpc
import httpx
import jwt
import pytest
from a2a.client import ClientCallContext, ClientConfig, ClientFactory
from a2a.client.errors import A2AClientError
from a2a.types import (
    AgentCard,
    AgentSkill,
    GetExtendedAgentCardRequest,
    Message,
    Role,
    SendMessageRequest,
    TaskState,
)
from a2a.utils.signing import create_signature_verifier
from google.protobuf.json_format import ParseDict

from a2ui_agent_kit.bindings import DEFAULT_INTERFACES, GRPC, Interface
from a2ui_agent_kit.card_signing import KEY_SET_PATH
from a2ui_agent_kit.sign_in import ApiKeySignIn, FakeAccount, current_account
from a2ui_agent_kit.testing import serving
from a2ui_agent_kit.versions import FIXTURE_VERSION, a2ui_messages
from a2ui_agent_kit.wire import data_part, part_data, plain, text_part

from .conftest import make_config
from .test_sign_in import _sign_in

PATHS = list(DEFAULT_INTERFACES)
IDS = [f"{i.binding}@{i.version}" for i in PATHS]
KEY_HEADER = "X-Test-Key"
KEY = "test-key-4f7c"


def _respond(action: dict) -> list[dict]:
    """A press answered with what reached the agent: its name, its context, its account."""
    account = current_account()
    return [
        {
            "version": FIXTURE_VERSION,
            "updateDataModel": {
                "surfaceId": action.get("surfaceId") or "s",
                "path": "/",
                "value": {
                    "action": action.get("name"),
                    "context": action.get("context") or {},
                    "who": account.account_id if account else None,
                },
            },
        }
    ]


def _respond_text(prompt: str) -> list[dict]:
    return [
        {
            "version": FIXTURE_VERSION,
            "createSurface": {"surfaceId": "q", "catalogId": "c"},
        },
        {
            "version": FIXTURE_VERSION,
            "updateComponents": {
                "surfaceId": "q",
                "components": [{"id": "root", "component": "Text", "text": f"asked: {prompt}"}],
            },
        },
    ]


def _skills_of(account) -> list[AgentSkill]:
    return [
        AgentSkill(
            id=f"own-{account.account_id}",
            name=f"{account.account_id}'s things",
            description="What this account alone holds.",
            tags=["own"],
        )
    ]


def _oauth_config(tmp_path, **overrides):
    return make_config(
        "basic",
        tmp_path,
        sign_in=_sign_in(),
        build_response=_respond,
        build_text_response=_respond_text,
        **overrides,
    )


def _key_config(tmp_path, **overrides):
    keys = ApiKeySignIn(
        header=KEY_HEADER,
        description="Your test key.",
        keys={KEY: FakeAccount("keyholder", {"name": "Key holder"})},
    )
    return make_config(
        "basic",
        tmp_path,
        sign_in=keys,
        build_response=_respond,
        build_text_response=_respond_text,
        **overrides,
    )


def _one_path(served: dict, interface: Interface) -> AgentCard:
    """The card as served, read in A2A 1.0's shape, listing `interface` alone."""
    card = ParseDict(served, AgentCard(), ignore_unknown_fields=True)
    kept = [
        i
        for i in card.supported_interfaces
        if (i.protocol_binding, i.protocol_version) == tuple(interface)
    ]
    assert len(kept) == 1, kept
    del card.supported_interfaces[:]
    card.supported_interfaces.extend(kept)
    return card


@contextlib.asynccontextmanager
async def _client(served: dict, interface: Interface, *, streaming: bool = True):
    config = ClientConfig(
        streaming=streaming,
        supported_protocol_bindings=[interface.binding],
        grpc_channel_factory=grpc.aio.insecure_channel,
    )
    client = ClientFactory(config).create(_one_path(served, interface))
    try:
        yield client
    finally:
        await client.close()


def _context(credential: dict[str, str] | None) -> ClientCallContext:
    # Lowercase names: gRPC carries the credential under the header's name in lowercase.
    return ClientCallContext(
        service_parameters={k.lower(): v for k, v in (credential or {}).items()}, timeout=20
    )


async def _ask(client, part, credential) -> list:
    request = SendMessageRequest(
        message=Message(message_id=secrets.token_hex(8), role=Role.ROLE_USER, parts=[part])
    )
    return [event async for event in client.send_message(request, context=_context(credential))]


def _last_status(events):
    """The last task status the answer reached."""
    for event in reversed(events):
        if event.HasField("status_update"):
            return event.status_update.status
        if event.HasField("task"):
            return event.task.status
    raise AssertionError(f"no status in {events}")


def _messages(events) -> list[dict]:
    """Every A2UI message the answer's status messages carry, read by content."""
    found = []
    for event in events:
        status = (
            event.status_update.status
            if event.HasField("status_update")
            else event.task.status if event.HasField("task") else None
        )
        if status is not None and status.HasField("message"):
            for part in status.message.parts:
                found.extend(a2ui_messages(part))
    return found


def _press(name: str, context: dict | None = None) -> dict:
    return {
        "version": FIXTURE_VERSION,
        "action": {"name": name, "surfaceId": "s1", "context": context or {}},
    }


async def _served(agent) -> dict:
    return (await agent.http.get("/.well-known/agent-card.json")).json()


async def _token(agent, scopes: list[str]) -> dict[str, str]:
    token = await agent.sign_in("ada", scopes)
    return {"Authorization": f"Bearer {token['access_token']}"}


# ---- the card --------------------------------------------------------------------------------


async def test_the_card_lists_the_six_paths_in_the_configs_order(tmp_path):
    order = [*DEFAULT_INTERFACES[3:], *DEFAULT_INTERFACES[:3]]
    async with serving(_oauth_config(tmp_path, interfaces=order), state_dir=tmp_path) as agent:
        served = await _served(agent)
    listed = [(i["protocolBinding"], i["protocolVersion"]) for i in served["supportedInterfaces"]]
    assert listed == [tuple(i) for i in order]
    urls = {(i["protocolBinding"]): i["url"] for i in served["supportedInterfaces"]}
    assert urls == {
        "JSONRPC": agent.base,
        "HTTP+JSON": f"{agent.base}/rest",
        "GRPC": agent.grpc_address,  # a bare host:port (a2uiverse task-20.9 decision 8)
    }


# ---- a question, a press, a refusal ----------------------------------------------------------


@pytest.mark.parametrize("interface", PATHS, ids=IDS)
async def test_a_question_is_answered_with_a2ui(tmp_path, interface):
    async with serving(_oauth_config(tmp_path), state_dir=tmp_path) as agent:
        credential = await _token(agent, ["issues.read"])
        async with _client(await _served(agent), interface) as client:
            events = await _ask(client, text_part("what is new"), credential)
    assert _last_status(events).state == TaskState.TASK_STATE_COMPLETED
    updates = [m for m in _messages(events) if "updateComponents" in m]
    assert updates[0]["updateComponents"]["components"][0]["text"] == "asked: what is new"


@pytest.mark.parametrize("interface", PATHS, ids=IDS)
@pytest.mark.parametrize("form", ["one object", "a bare list"])
async def test_a_press_is_read_by_its_content(tmp_path, interface, form):
    press = _press("greet", {"count": 3, "label": "three"})
    data = press if form == "one object" else [press]
    async with serving(_oauth_config(tmp_path), state_dir=tmp_path) as agent:
        credential = await _token(agent, ["issues.read"])
        async with _client(await _served(agent), interface) as client:
            events = await _ask(client, data_part(data), credential)
    (update,) = [m for m in _messages(events) if "updateDataModel" in m]
    # The press's context as the client sent it, a whole number still whole.
    assert update["updateDataModel"]["value"] == {
        "action": "greet",
        "context": {"count": 3, "label": "three"},
        "who": "ada",
    }


@pytest.mark.parametrize("interface", PATHS, ids=IDS)
async def test_a_call_without_a_credential_is_refused_for_sign_in(tmp_path, interface):
    async with serving(_oauth_config(tmp_path), state_dir=tmp_path) as agent:
        async with _client(await _served(agent), interface) as client:
            with pytest.raises(A2AClientError) as refused:
                await _ask(client, text_part("what is new"), None)
            with pytest.raises(A2AClientError):
                await _ask(client, text_part("what is new"), {"Authorization": "Bearer nope"})
    _assert_refused_for_sign_in(refused.value, interface)


@pytest.mark.parametrize("interface", PATHS, ids=IDS)
async def test_a_key_app_takes_its_key_on_every_path(tmp_path, interface):
    async with serving(_key_config(tmp_path), state_dir=tmp_path) as agent:
        async with _client(await _served(agent), interface) as client:
            with pytest.raises(A2AClientError) as refused:
                await _ask(client, data_part(_press("greet")), None)
            events = await _ask(client, data_part(_press("greet")), {KEY_HEADER: KEY})
    _assert_refused_for_sign_in(refused.value, interface)
    (update,) = [m for m in _messages(events) if "updateDataModel" in m]
    assert update["updateDataModel"]["value"]["who"] == "keyholder"


def _assert_refused_for_sign_in(error: Exception, interface: Interface) -> None:
    """HTTP 401 on the four HTTP paths, `UNAUTHENTICATED` on gRPC (a2uiverse task-20.5
    decision 8)."""
    causes = []
    while error is not None:
        causes.append(error)
        error = error.__cause__ or error.__context__
    if interface.binding == GRPC:
        codes = [c.code() for c in causes if isinstance(c, grpc.aio.AioRpcError)]
        assert codes == [grpc.StatusCode.UNAUTHENTICATED], causes
    else:
        statuses = [
            c.response.status_code for c in causes if isinstance(c, httpx.HTTPStatusError)
        ]
        # The SDK's JSON-RPC client at A2A 1.0 keeps the status in its message alone.
        assert statuses == [401] or str(causes[0]).startswith("HTTP Error 401:"), causes


# ---- the request for more access -------------------------------------------------------------


@pytest.mark.parametrize("interface", PATHS, ids=IDS)
async def test_a_press_needing_more_access_asks_for_it_and_ends_there(tmp_path, interface):
    async with serving(_oauth_config(tmp_path), state_dir=tmp_path) as agent:
        credential = await _token(agent, ["issues.read"])
        async with _client(await _served(agent), interface) as client:
            # The stream ends when the task moves to auth-required (decision 12): the
            # iteration returns.
            events = await _ask(client, data_part(_press("close_issue")), credential)
    status = _last_status(events)
    assert status.state == TaskState.TASK_STATE_AUTH_REQUIRED
    requests = [part_data(p) for p in status.message.parts if p.HasField("data")]
    # A2A 1.0's requirement shape on either version, the part unmarked (decision 3).
    assert requests == [
        {"securityRequirements": [{"schemes": {"signIn": {"list": ["issues.write"]}}}]}
    ]
    assert all(not p.media_type for p in status.message.parts if p.HasField("data"))


# ---- the signed card -------------------------------------------------------------------------


async def test_a_signed_card_verifies_against_its_key_set_under_the_base_url(tmp_path):
    async with serving(_oauth_config(tmp_path, sign_card=True), state_dir=tmp_path) as agent:
        served = await _served(agent)
        key_set = (await agent.http.get(KEY_SET_PATH)).json()
    (signature,) = served["signatures"]
    header = jwt.get_unverified_header(f"{signature['protected']}..{signature['signature']}")
    assert header["alg"] == "ES256" and header["typ"] == "JOSE"
    assert header["jku"] == f"{agent.base}{KEY_SET_PATH}"
    (key,) = key_set["keys"]
    assert key["kid"] == header["kid"] and key["crv"] == "P-256" and "d" not in key
    public = jwt.PyJWK(key).key
    verify = create_signature_verifier(lambda kid, jku: public, ["ES256"])
    verify(ParseDict(served, AgentCard(), ignore_unknown_fields=True))


async def test_the_signing_key_is_kept_in_the_state_directory_across_runs(tmp_path):
    config = _oauth_config(tmp_path, sign_card=True)
    async with serving(config, state_dir=tmp_path) as agent:
        first = (await agent.http.get(KEY_SET_PATH)).json()
    async with serving(config, state_dir=tmp_path) as agent:
        second = (await agent.http.get(KEY_SET_PATH)).json()
    assert first == second
    assert (tmp_path / "card-signing-key.json").stat().st_mode & 0o077 == 0


async def test_signing_off_serves_no_signature_and_no_key_set(tmp_path):
    async with serving(_oauth_config(tmp_path), state_dir=tmp_path) as agent:
        served = await _served(agent)
        key_set = await agent.http.get(KEY_SET_PATH)
    assert "signatures" not in served
    assert key_set.status_code == 404


# ---- the account's card ----------------------------------------------------------------------


@pytest.mark.parametrize("interface", PATHS, ids=IDS)
async def test_an_account_is_served_a_card_with_its_own_skills(tmp_path, interface):
    config = _oauth_config(tmp_path, account_skills=_skills_of, sign_card=True)
    async with serving(config, state_dir=tmp_path) as agent:
        served = await _served(agent)
        credential = await _token(agent, ["issues.read"])
        async with _client(served, interface, streaming=False) as client:
            own = await client.get_extended_agent_card(
                GetExtendedAgentCardRequest(), context=_context(credential)
            )
            with pytest.raises(A2AClientError) as refused:
                await client.get_extended_agent_card(
                    GetExtendedAgentCardRequest(), context=_context(None)
                )
    assert served["capabilities"]["extendedAgentCard"] is True
    assert [s.id for s in own.skills] == ["own-ada"]
    assert own.name == served["name"]
    assert [plain(e.params) for e in own.capabilities.extensions] == [
        e.get("params") for e in served["capabilities"]["extensions"]
    ]
    assert len(own.signatures) == 1
    _assert_refused_for_sign_in(refused.value, interface)


async def test_the_extended_card_is_off_by_default(tmp_path):
    async with serving(_oauth_config(tmp_path), state_dir=tmp_path) as agent:
        served = await _served(agent)
    assert "extendedAgentCard" not in served["capabilities"]


async def test_a_grpc_port_another_agent_holds_stops_the_app(tmp_path):
    # The launcher's preview copy beside a running agent once listened on the same gRPC port,
    # gRPC's port reuse letting it; a taken port now fails as a taken HTTP port does.
    from a2ui_agent_kit.server import build_app

    config = _oauth_config(tmp_path)
    async with serving(config, state_dir=tmp_path) as agent:
        port = int(agent.grpc_address.rsplit(":", 1)[1])
        second = build_app(config, "deterministic", "127.0.0.1", 1, grpc_port=port, state_dir=tmp_path)
        with pytest.raises(RuntimeError, match="Failed to bind"):
            async with second.router.lifespan_context(second):
                pass
