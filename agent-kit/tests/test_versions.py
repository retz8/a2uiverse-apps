"""The per-app version set and what it drives (a2uiverse task-19.4): the config, the card, the
version each request is answered in, the stamp at send, the actions taken, the entitlement
read and the recorder — over the three sets, v0.9 only, v0.9.1 only and both.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from a2a.types import DataPart, Message, Part, Role, TextPart
from a2ui.a2a.parts import A2UI_MIME_TYPE, DEPRECATED_A2UI_MIME_TYPE
from starlette.testclient import TestClient

from a2ui_agent_kit.catalog_lines import advertised_catalog_ids, catalog_lines
from a2ui_agent_kit.executor_deterministic import DeterministicAgentExecutor
from a2ui_agent_kit.executor_llm import APOLOGY_TEXT, MAX_ATTEMPTS, LlmAgentExecutor
from a2ui_agent_kit.paint_meta import PAINT_META_MIME
from a2ui_agent_kit.recorder import SessionRecorder
from a2ui_agent_kit.responses import fixture_responder
from a2ui_agent_kit.server import build_agent_card, build_app
from a2ui_agent_kit.versions import A2UI_VERSIONS, EXTENSION_URIS, stamped_part

from .conftest import FIXTURES_DIR, make_config
from .test_catalog_lines import NEW_ID, OLD_ID, _two_line_config
from .test_llm_executor import _BAD_SURFACE_S1, _FakeResponder, _valid_surface_text

V09_URI = "https://a2ui.org/a2a-extension/a2ui/v0.9"
V091_URI = "https://a2ui.org/a2a-extension/a2ui/v0.9.1"

SETS = {"v0.9": ["v0.9"], "v0.9.1": ["v0.9.1"], "both": ["v0.9", "v0.9.1"]}
# The extension URIs a request names: the hub names both.
REQUESTS = {"both": [V09_URI, V091_URI], "v0.9": [V09_URI], "v0.9.1": [V091_URI], "none": []}
# The MIME type upstream's part helper gives each version.
MIME = {"v0.9": DEPRECATED_A2UI_MIME_TYPE, "v0.9.1": A2UI_MIME_TYPE}

# Each set's request answered: the version landed on and the URI A2A names back as activated.
CHOICES = [
    ("v0.9", "both", "v0.9", V09_URI),
    ("v0.9", "v0.9", "v0.9", V09_URI),
    ("v0.9", "v0.9.1", "v0.9", None),
    ("v0.9", "none", "v0.9", None),
    ("v0.9.1", "both", "v0.9.1", V091_URI),
    ("v0.9.1", "v0.9", "v0.9.1", None),
    ("v0.9.1", "v0.9.1", "v0.9.1", V091_URI),
    ("v0.9.1", "none", "v0.9.1", None),
    ("both", "both", "v0.9.1", V091_URI),
    ("both", "v0.9", "v0.9", V09_URI),
    ("both", "v0.9.1", "v0.9.1", V091_URI),
    ("both", "none", "v0.9.1", None),
]
# One request per set as the hub sends it, and the both app asked by an upstream v0.9 client:
# every version a set can land on.
LANDINGS = [
    ("v0.9", "both", "v0.9"),
    ("v0.9.1", "both", "v0.9.1"),
    ("both", "both", "v0.9.1"),
    ("both", "v0.9", "v0.9"),
]

# Verbatim copies of the extension entries of the sdk's three kit-shape cards, each with the
# catalog id its card names.
CARD_FIXTURES = {
    # a2uiverse/packages/sdk/js/test/fixtures/cards/kit-v09-only.json
    "v0.9": (
        "https://a2uiverse.dev/catalogs/shop-a/catalog.json",
        [
            {
                "uri": "https://a2ui.org/a2a-extension/a2ui/v0.9",
                "description": "Provides agent driven UI using the A2UI JSON format.",
                "params": {
                    "supportedCatalogIds": ["https://a2uiverse.dev/catalogs/shop-a/catalog.json"]
                },
            }
        ],
    ),
    # a2uiverse/packages/sdk/js/test/fixtures/cards/kit-v091-only.json
    "v0.9.1": (
        "https://a2uiverse.dev/catalogs/github/catalog.json",
        [
            {
                "uri": "https://a2ui.org/a2a-extension/a2ui/v0.9.1",
                "description": "Provides agent driven UI using the A2UI JSON format.",
                "params": {
                    "v0.9.1": {
                        "supportedCatalogIds": [
                            "https://a2uiverse.dev/catalogs/github/catalog.json"
                        ]
                    }
                },
            }
        ],
    ),
    # a2uiverse/packages/sdk/js/test/fixtures/cards/kit-both.json
    "both": (
        "https://a2uiverse.dev/catalogs/calendar/catalog.json",
        [
            {
                "uri": "https://a2ui.org/a2a-extension/a2ui/v0.9",
                "description": "Provides agent driven UI using the A2UI JSON format.",
                "params": {
                    "supportedCatalogIds": [
                        "https://a2uiverse.dev/catalogs/calendar/catalog.json"
                    ]
                },
            },
            {
                "uri": "https://a2ui.org/a2a-extension/a2ui/v0.9.1",
                "description": "Provides agent driven UI using the A2UI JSON format.",
                "params": {
                    "supportedCatalogIds": [
                        "https://a2uiverse.dev/catalogs/calendar/catalog.json"
                    ]
                },
            },
        ],
    ),
}


def _responder_pair():
    return fixture_responder(
        FIXTURES_DIR / "deterministic",
        {"greet": "greeting.json", "open": "titled.json"},
        text_fixture="digest.json",
        surface_prefix="test",
    )


def _config(tmp_path: Path, versions: list[str], **overrides):
    build_response, build_text_response = _responder_pair()
    fields = dict(
        a2ui_versions=versions,
        build_response=build_response,
        build_text_response=build_text_response,
    )
    fields.update(overrides)
    return make_config("basic", tmp_path, **fields)


class _Ctx:
    """A request as the A2A server hands it over: its message and the extensions it names."""

    def __init__(self, message: Message, requested: list[str] = ()):
        self.message = message
        self.current_task = None
        self.requested_extensions = set(requested)
        self.activated: set[str] = set()

    def add_activated_extension(self, uri: str) -> None:
        self.activated.add(uri)


class _Queue:
    def __init__(self):
        self.events = []

    async def enqueue_event(self, event):
        self.events.append(event)

    def parts(self) -> list[Part]:
        found = []
        for event in self.events:
            message = getattr(getattr(event, "status", None), "message", None)
            found.extend(getattr(message, "parts", None) or [])
        return found

    def a2ui_parts(self) -> list[DataPart]:
        return [
            p.root
            for p in self.parts()
            if isinstance(p.root, DataPart) and "paintMeta" not in p.root.data
        ]

    def texts(self) -> list[str]:
        return [p.root.text for p in self.parts() if isinstance(p.root, TextPart)]


def _text(text: str = "What needs my attention today?", metadata=None) -> Message:
    return Message(
        message_id="m1",
        role=Role.user,
        parts=[Part(root=TextPart(text=text))],
        metadata=metadata,
        context_id="c1",
    )


def _action(name: str, stamp: str) -> Message:
    return Message(
        message_id="m2",
        role=Role.user,
        parts=[Part(root=DataPart(data={"version": stamp, "action": {"name": name, "surfaceId": "s1"}}))],
        context_id="c1",
    )


def _deterministic(config) -> DeterministicAgentExecutor:
    return DeterministicAgentExecutor(
        config.build_response,
        config.build_text_response,
        lines=catalog_lines(config),
        card=build_agent_card(config, "http://localhost:19999"),
        versions=config.a2ui_versions,
    )


def _llm(config, responder, **kwargs) -> LlmAgentExecutor:
    return LlmAgentExecutor(
        responder, config, card=build_agent_card(config, "http://localhost:19999"), **kwargs
    )


def _model_text(text: str, version: str) -> str:
    """A model response with every message the model wrote stamped `version`."""
    head, _, rest = text.partition("<a2ui-json>")
    body, _, tail = rest.partition("</a2ui-json>")
    messages = [{**m, "version": version} for m in json.loads(body)]
    return f"{head}<a2ui-json>{json.dumps(messages)}</a2ui-json>{tail}"


def _other(version: str) -> str:
    return next(v for v in A2UI_VERSIONS if v != version)


def _assert_stamped(parts: list[DataPart], version: str) -> None:
    assert parts
    for part in parts:
        assert part.data["version"] == version
        assert part.metadata == {"mimeType": MIME[version]}


# ---- the config --------------------------------------------------------------------------


def test_the_field_omitted_means_both(tmp_path):
    assert make_config("basic", tmp_path).a2ui_versions == ("v0.9", "v0.9.1")


@pytest.mark.parametrize("name", SETS)
def test_each_explicit_set_is_held(tmp_path, name):
    assert make_config("basic", tmp_path, a2ui_versions=SETS[name]).a2ui_versions == tuple(SETS[name])


def test_the_order_written_carries_no_meaning(tmp_path):
    config = make_config("basic", tmp_path, a2ui_versions=["v0.9.1", "v0.9"])
    assert config.a2ui_versions == ("v0.9", "v0.9.1")


def test_a_version_the_kit_does_not_speak_stops_the_app_naming_it(tmp_path):
    with pytest.raises(ValueError, match=r"'v1\.0'.*v0\.9, v0\.9\.1"):
        make_config("basic", tmp_path, a2ui_versions=["v0.9", "v1.0"])


def test_an_empty_set_stops_the_app(tmp_path):
    with pytest.raises(ValueError, match="empty"):
        make_config("basic", tmp_path, a2ui_versions=[])


def test_a_bare_string_is_not_a_set(tmp_path):
    with pytest.raises(ValueError, match="list of versions"):
        make_config("basic", tmp_path, a2ui_versions="v0.9")


def test_the_kit_speaks_each_version_under_its_extension_uri():
    assert EXTENSION_URIS == {"v0.9": V09_URI, "v0.9.1": V091_URI}


# ---- the card ----------------------------------------------------------------------------


@pytest.mark.parametrize("name", SETS)
def test_the_card_is_the_sdks_fixture_for_its_set(tmp_path, name):
    catalog_id, extensions = CARD_FIXTURES[name]
    catalog = json.loads((FIXTURES_DIR / "catalog-basic.json").read_text(encoding="utf-8"))
    catalog["catalogId"] = catalog_id
    catalog_path = tmp_path / "catalog.json"
    catalog_path.write_text(json.dumps(catalog), encoding="utf-8")
    config = make_config("basic", tmp_path, catalog_path=catalog_path, a2ui_versions=SETS[name])

    card = build_agent_card(config, "http://localhost:19999")

    built = [
        e.model_dump(mode="json", by_alias=True, exclude_none=True)
        for e in card.capabilities.extensions
    ]
    assert built == extensions


# ---- the choice --------------------------------------------------------------------------


def _send(client: TestClient, method: str, message: dict, requested: list[str]):
    headers = {"X-A2A-Extensions": ", ".join(requested)} if requested else {}
    rpc = {"jsonrpc": "2.0", "id": "1", "method": method, "params": {"message": message}}
    return client.post("/", json=rpc, headers=headers)


_WIRE_TEXT = {
    "kind": "message",
    "messageId": "m1",
    "role": "user",
    "parts": [{"kind": "text", "text": "What needs my attention today?"}],
}


@pytest.mark.parametrize(("name", "request_name", "landed", "activated"), CHOICES)
def test_a_served_request_lands_on_its_version_and_names_it_back(
    tmp_path, name, request_name, landed, activated
):
    app = build_app(_config(tmp_path, SETS[name]), "deterministic", "localhost", 19999)
    with TestClient(app) as client:
        response = _send(client, "message/send", _WIRE_TEXT, REQUESTS[request_name])

    assert response.headers.get("X-A2A-Extensions") == activated
    parts = response.json()["result"]["status"]["message"]["parts"]
    stamps = {p["data"]["version"] for p in parts if p["kind"] == "data"}
    assert stamps == {landed}


@pytest.mark.parametrize(("name", "request_name", "landed", "_activated"), CHOICES)
def test_a_streamed_request_lands_on_its_version(tmp_path, name, request_name, landed, _activated):
    # The hub streams. A2A writes a stream's response headers before the agent runs, so the
    # activation header is not on a stream; the stamp is.
    app = build_app(_config(tmp_path, SETS[name]), "deterministic", "localhost", 19999)
    with TestClient(app) as client:
        response = _send(client, "message/stream", _WIRE_TEXT, REQUESTS[request_name])

    events = [json.loads(line[5:]) for line in response.text.splitlines() if line.startswith("data:")]
    stamps = {
        p["data"]["version"]
        for e in events
        for p in ((e["result"].get("status") or {}).get("message") or {}).get("parts", [])
        if p["kind"] == "data"
    }
    assert stamps == {landed}


@pytest.mark.parametrize(("name", "request_name", "landed", "activated"), CHOICES)
async def test_the_model_path_lands_on_its_version_and_registers_it(
    tmp_path, name, request_name, landed, activated
):
    config = _config(tmp_path, SETS[name])
    context = _Ctx(_text(), REQUESTS[request_name])
    queue = _Queue()

    await _llm(config, _FakeResponder([_valid_surface_text()])).execute(context, queue)

    assert context.activated == ({activated} if activated else set())
    assert {p.data["version"] for p in queue.a2ui_parts()} == {landed}


# ---- the stamp ---------------------------------------------------------------------------


@pytest.mark.parametrize(("name", "request_name", "landed"), LANDINGS)
async def test_a_fixture_written_in_v09_goes_out_in_the_version_landed_on(
    tmp_path, name, request_name, landed
):
    queue = _Queue()
    context = _Ctx(_text(), REQUESTS[request_name])
    await _deterministic(_config(tmp_path, SETS[name])).execute(context, queue)
    _assert_stamped(queue.a2ui_parts(), landed)


@pytest.mark.parametrize(("name", "request_name", "landed"), LANDINGS)
async def test_a_paint_meta_part_is_left_as_it_is(tmp_path, name, request_name, landed):
    queue = _Queue()
    context = _Ctx(_action("open", "v0.9"), REQUESTS[request_name])
    await _deterministic(_config(tmp_path, SETS[name])).execute(context, queue)

    metas = [p.root for p in queue.parts() if "paintMeta" in p.root.data]
    assert [(m.data, m.metadata) for m in metas] == [
        ({"paintMeta": {"surfaceId": "test-1", "title": "Digest"}}, {"mimeType": PAINT_META_MIME})
    ]
    _assert_stamped(queue.a2ui_parts(), landed)


@pytest.mark.parametrize(("name", "request_name", "landed"), LANDINGS)
async def test_the_unhandled_event_fallback_goes_out_in_the_version_landed_on(
    tmp_path, name, request_name, landed
):
    queue = _Queue()
    context = _Ctx(_action("mystery", "v0.9"), REQUESTS[request_name])
    await _deterministic(_config(tmp_path, SETS[name])).execute(context, queue)

    (part,) = queue.a2ui_parts()
    assert part.data["updateComponents"]["components"][0]["text"] == "Unhandled event: mystery"
    _assert_stamped([part], landed)


@pytest.mark.parametrize(("name", "request_name", "landed"), LANDINGS)
async def test_the_models_streamed_parts_go_out_in_the_version_landed_on(
    tmp_path, name, request_name, landed
):
    # The model wrote the other version: the stamp writes over it.
    responder = _FakeResponder([_model_text(_valid_surface_text(), _other(landed))])
    queue = _Queue()
    await _llm(_config(tmp_path, SETS[name]), responder).execute(
        _Ctx(_text(), REQUESTS[request_name]), queue
    )
    assert any("createSurface" in p.data for p in queue.a2ui_parts())
    _assert_stamped(queue.a2ui_parts(), landed)


@pytest.mark.parametrize(("name", "request_name", "landed"), LANDINGS)
async def test_the_end_of_turn_flush_goes_out_in_the_version_landed_on(
    tmp_path, name, request_name, landed
):
    # An update to a surface an earlier turn painted is held back and sent at the turn's end.
    update = [
        {
            "version": _other(landed),
            "updateComponents": {
                "surfaceId": "proposal",
                "components": [
                    {"id": "root", "component": "Card", "child": "said"},
                    {"id": "said", "component": "Text", "text": "Discarded"},
                ],
            },
        }
    ]
    responder = _FakeResponder(["<a2ui-json>" + json.dumps(update) + "</a2ui-json>"])
    queue = _Queue()
    await _llm(_config(tmp_path, SETS[name]), responder).execute(
        _Ctx(_text("discard it"), REQUESTS[request_name]), queue
    )
    (part,) = queue.a2ui_parts()
    assert part.data["updateComponents"]["surfaceId"] == "proposal"
    _assert_stamped([part], landed)


@pytest.mark.parametrize(("name", "request_name", "landed"), LANDINGS)
async def test_the_teardown_delete_goes_out_in_the_version_landed_on(
    tmp_path, name, request_name, landed
):
    responder = _FakeResponder([_BAD_SURFACE_S1] * MAX_ATTEMPTS)
    queue = _Queue()
    await _llm(_config(tmp_path, SETS[name]), responder).execute(
        _Ctx(_text(), REQUESTS[request_name]), queue
    )
    deletes = [p for p in queue.a2ui_parts() if "deleteSurface" in p.data]
    assert [p.data for p in deletes] == [{"version": landed, "deleteSurface": {"surfaceId": "s1"}}]
    _assert_stamped(queue.a2ui_parts(), landed)
    assert APOLOGY_TEXT in queue.texts()


def test_the_stamp_writes_over_any_version_and_leaves_the_message_as_it_was():
    message = {"version": "v0.9", "deleteSurface": {"surfaceId": "s"}}
    part = stamped_part(message, "v0.9.1")
    assert part.root.data == {"version": "v0.9.1", "deleteSurface": {"surfaceId": "s"}}
    assert part.root.metadata == {"mimeType": A2UI_MIME_TYPE}
    assert message == {"version": "v0.9", "deleteSurface": {"surfaceId": "s"}}


# ---- the actions -------------------------------------------------------------------------

# (set, request, chosen version, action stamp, whether the action is taken)
ACTIONS = [
    (name, request_name, landed, stamp, stamp == "v0.9" or landed == "v0.9.1")
    for name, request_name, landed in LANDINGS
    for stamp in A2UI_VERSIONS
]


@pytest.mark.parametrize(("name", "request_name", "landed", "stamp", "taken"), ACTIONS)
async def test_deterministic_takes_the_actions_the_chosen_versions_schema_admits(
    tmp_path, name, request_name, landed, stamp, taken
):
    queue = _Queue()
    context = _Ctx(_action("greet", stamp), REQUESTS[request_name])
    await _deterministic(_config(tmp_path, SETS[name])).execute(context, queue)

    (part,) = queue.a2ui_parts()
    text = part.data["updateComponents"]["components"][0]["text"]
    # Not taken, the message carries nothing the executor reads: the unhandled-event paint.
    assert text == ("ok" if taken else "Unhandled event: ")


@pytest.mark.parametrize(("name", "request_name", "landed", "stamp", "taken"), ACTIONS)
async def test_the_model_path_takes_the_actions_the_chosen_versions_schema_admits(
    tmp_path, name, request_name, landed, stamp, taken
):
    responder = _FakeResponder([_valid_surface_text()])
    queue = _Queue()
    context = _Ctx(_action("greet", stamp), REQUESTS[request_name])
    await _llm(_config(tmp_path, SETS[name]), responder).execute(context, queue)

    if taken:
        assert responder.calls == 1
        assert 'activated the "greet" action' in responder.prompts[0]
    else:
        # Not taken, the message carries nothing to compose: the apology, no model call.
        assert responder.calls == 0
        assert queue.texts() == [APOLOGY_TEXT]


# ---- the entitlement ---------------------------------------------------------------------

A_ID = "https://example.test/keyed-v09/catalog.json"
B_ID = "https://example.test/keyed-v091/catalog.json"
C_ID = "https://example.test/flat/catalog.json"
KEYED_V09 = {"v0.9": {"supportedCatalogIds": [A_ID]}}
KEYED_V091 = {"v0.9.1": {"supportedCatalogIds": [B_ID]}}
FLAT = {"supportedCatalogIds": [C_ID]}


@pytest.mark.parametrize(
    ("capabilities", "version", "expected"),
    [
        # The chosen version's key first.
        ({**KEYED_V09, **KEYED_V091, **FLAT}, "v0.9", [A_ID]),
        ({**KEYED_V09, **KEYED_V091, **FLAT}, "v0.9.1", [B_ID]),
        # Then the other version's key.
        ({**KEYED_V091, **FLAT}, "v0.9", [B_ID]),
        ({**KEYED_V09, **FLAT}, "v0.9.1", [A_ID]),
        # Then flat.
        (FLAT, "v0.9", [C_ID]),
        (FLAT, "v0.9.1", [C_ID]),
    ],
)
def test_the_entitlement_is_read_under_the_chosen_key_then_the_other_then_flat(
    capabilities, version, expected
):
    message = _text(metadata={"a2uiClientCapabilities": capabilities})
    assert advertised_catalog_ids(message, version) == expected


@pytest.mark.parametrize(("request_name", "painted_in"), [("v0.9", OLD_ID), ("v0.9.1", NEW_ID)])
async def test_a_turn_is_painted_in_the_catalog_its_version_is_advertised(
    tmp_path, request_name, painted_in
):
    # Two catalog lines, each version's key naming one of them: the version a request lands
    # on decides the line the turn is painted in.
    config = _two_line_config(tmp_path)
    capabilities = {
        "v0.9": {"supportedCatalogIds": [OLD_ID]},
        "v0.9.1": {"supportedCatalogIds": [NEW_ID]},
    }
    queue = _Queue()
    context = _Ctx(_text(metadata={"a2uiClientCapabilities": capabilities}), REQUESTS[request_name])
    await _deterministic(config).execute(context, queue)

    (create,) = [p.data["createSurface"] for p in queue.a2ui_parts() if "createSurface" in p.data]
    assert create["catalogId"] == painted_in


# ---- the recorder ------------------------------------------------------------------------


def test_the_recorder_keeps_a_v091_part_as_it_was_sent(tmp_path):
    recorder = SessionRecorder(tmp_path)
    recorder.start_turn(context_id="ctx", task_id="t", kind="utterance", prompt="p")
    sent = {"version": "v0.9.1", "createSurface": {"surfaceId": "s1", "catalogId": "c"}}
    foreign = {"version": "v1.0", "createSurface": {"surfaceId": "s2", "catalogId": "c"}}
    recorder.record_batch([stamped_part(sent, "v0.9.1"), stamped_part(foreign, "v1.0")])
    recorder.end_turn("completed")

    session = json.loads(next(tmp_path.glob("*.json")).read_text(encoding="utf-8"))
    (batch,) = session["turns"][0]["batches"]
    assert batch["messages"] == [sent]
