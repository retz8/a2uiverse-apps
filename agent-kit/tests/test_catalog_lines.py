"""An old catalog line beside the current one: the id each turn is painted in (a2uiverse
task-15.7).

The fixture app's current line is the basic fixture catalog; its old line is the custom one,
whose ConfirmationDialog the basic catalog lacks, so which line validated a turn shows.
"""

import json
from pathlib import Path

import pytest
from a2a.types import DataPart, Message, Part, Role, TextPart

from a2ui_agent_kit.catalog_lines import (
    advertised_catalog_ids,
    catalog_lines,
    turn_line,
)
from a2ui_agent_kit.config import CatalogLine
from a2ui_agent_kit.executor_deterministic import DeterministicAgentExecutor
from a2ui_agent_kit.executor_llm import LlmAgentExecutor
from a2ui_agent_kit.paint_meta import require_root_component
from a2ui_agent_kit.prompt import build_system_prompt
from a2ui_agent_kit.server import build_agent_card

from .conftest import FIXTURES_DIR, make_config

NEW_ID = "https://example.test/a2uiverse-kit/basic/catalog.json"
OLD_ID = "https://example.test/a2uiverse-kit/custom/catalog.json"
PUBLIC_BASIC_ID = "https://a2ui.org/specification/v0_9/basic_catalog.json"
NOT_SHOWN = "Test Agent has changed and can't show this here."


def _surface(surface_id: str, catalog_id: str, text: str) -> list[dict]:
    return [
        {"version": "v0.9", "createSurface": {"surfaceId": surface_id, "catalogId": catalog_id}},
        {
            "version": "v0.9",
            "updateComponents": {
                "surfaceId": surface_id,
                "components": [
                    {"id": "root", "component": "Column", "children": ["t"]},
                    {"id": "t", "component": "Text", "text": text},
                ],
            },
        },
    ]


def _old_line(tmp_path: Path, **overrides) -> CatalogLine:
    brand = tmp_path / "old-brand.md"
    brand.write_text("Old line: a ConfirmationDialog fronts every proposal.", encoding="utf-8")
    fields = dict(
        catalog_path=FIXTURES_DIR / "catalog-custom.json",
        catalog_kind="custom",
        examples_dir=FIXTURES_DIR / "examples-custom",
        brand_guidance_path=brand,
        question_policy=require_root_component("ConfirmationDialog"),
        build_response=lambda action: _surface("old-answer", OLD_ID, f"old {action['name']}"),
        build_text_response=lambda text: _surface("old-1", OLD_ID, "old"),
    )
    fields.update(overrides)
    return CatalogLine(**fields)


def _two_line_config(tmp_path: Path, **overrides):
    fields = dict(
        build_response=lambda action: _surface("new-answer", NEW_ID, f"new {action['name']}"),
        build_text_response=lambda text: _surface("new-1", NEW_ID, "new"),
        old_catalog_line=_old_line(tmp_path),
    )
    fields.update(overrides)
    return make_config("basic", tmp_path, **fields)


def _capabilities(*ids: str) -> dict:
    # The hub's form: keyed by the protocol version, the basic catalog first (SPEC §14).
    return {"a2uiClientCapabilities": {"v0.9": {"supportedCatalogIds": list(ids)}}}


def _text_message(text: str, metadata: dict | None, context_id: str = "c1") -> Message:
    return Message(
        message_id="m1",
        role=Role.user,
        parts=[Part(root=TextPart(text=text))],
        metadata=metadata,
        context_id=context_id,
    )


def _action_message(action: dict, metadata: dict | None, context_id: str = "c1") -> Message:
    return Message(
        message_id="m2",
        role=Role.user,
        parts=[Part(root=DataPart(data={"version": "v0.9", "action": action}))],
        metadata=metadata,
        context_id=context_id,
    )


class _Ctx:
    def __init__(self, message: Message):
        self.message = message
        self.current_task = None


class _Queue:
    def __init__(self):
        self.events = []

    async def enqueue_event(self, event):
        self.events.append(event)

    def a2ui(self) -> list[dict]:
        return [
            p.root.data
            for p in self._parts()
            if isinstance(p.root, DataPart) and "version" in p.root.data
        ]

    def texts(self) -> list[str]:
        return [p.root.text for p in self._parts() if isinstance(p.root, TextPart)]

    def _parts(self) -> list[Part]:
        parts = []
        for event in self.events:
            message = getattr(getattr(event, "status", None), "message", None)
            parts.extend(getattr(message, "parts", None) or [])
        return parts


async def _turn(executor, message: Message) -> _Queue:
    queue = _Queue()
    await executor.execute(_Ctx(message), queue)
    return queue


# ---- the card and the lines ----------------------------------------------------------


def test_the_card_names_both_ids_newest_first(tmp_path):
    (extension,) = build_agent_card(
        _two_line_config(tmp_path), "http://localhost:19999"
    ).capabilities.extensions
    assert extension.params["supportedCatalogIds"] == [NEW_ID, OLD_ID]


def test_an_app_with_one_line_names_its_one_id(tmp_path):
    (extension,) = build_agent_card(
        make_config("basic", tmp_path), "http://localhost:19999"
    ).capabilities.extensions
    assert extension.params["supportedCatalogIds"] == [NEW_ID]


def test_the_kit_refuses_to_start_when_the_old_line_is_the_new_lines_id(tmp_path):
    config = make_config(
        "basic",
        tmp_path,
        old_catalog_line=_old_line(tmp_path, catalog_path=FIXTURES_DIR / "catalog-basic.json"),
    )
    with pytest.raises(ValueError, match="old catalog line"):
        build_agent_card(config, "http://localhost:19999")


def test_both_advertised_a_new_surface_takes_the_newer_whatever_the_hubs_order(tmp_path):
    lines = catalog_lines(_two_line_config(tmp_path))
    turn = lines.choose([PUBLIC_BASIC_ID, OLD_ID, NEW_ID])
    assert turn.catalog_id == NEW_ID and not turn.fresh_surface


def test_only_the_old_advertised_a_new_surface_takes_the_old(tmp_path):
    # An install from before the update: the hub advertises the ids the installed card named.
    turn = catalog_lines(_two_line_config(tmp_path)).choose([PUBLIC_BASIC_ID, OLD_ID])
    assert turn.catalog_id == OLD_ID


def test_no_capabilities_take_the_newer(tmp_path):
    assert catalog_lines(_two_line_config(tmp_path)).choose(None).catalog_id == NEW_ID


def test_neither_id_named_chooses_no_line(tmp_path):
    assert catalog_lines(_two_line_config(tmp_path)).choose([PUBLIC_BASIC_ID]) is None


def test_an_action_on_an_old_surface_is_written_in_the_old_id(tmp_path):
    turn = catalog_lines(_two_line_config(tmp_path)).choose(
        [NEW_ID, OLD_ID], pressed_catalog_id=OLD_ID
    )
    assert turn.catalog_id == OLD_ID and not turn.fresh_surface


def test_an_action_on_a_surface_whose_id_is_no_longer_advertised_falls_to_a_fresh_surface(tmp_path):
    turn = catalog_lines(_two_line_config(tmp_path)).choose([NEW_ID], pressed_catalog_id=OLD_ID)
    assert turn.catalog_id == NEW_ID and turn.fresh_surface


def test_an_action_on_a_surface_of_a_line_no_longer_held_falls_to_a_fresh_surface(tmp_path):
    turn = catalog_lines(make_config("basic", tmp_path)).choose(
        [NEW_ID, OLD_ID], pressed_catalog_id=OLD_ID
    )
    assert turn.catalog_id == NEW_ID and turn.fresh_surface


@pytest.mark.parametrize(
    ("metadata", "expected"),
    [
        (_capabilities(PUBLIC_BASIC_ID, NEW_ID), [PUBLIC_BASIC_ID, NEW_ID]),
        ({"a2uiClientCapabilities": {"supportedCatalogIds": [NEW_ID]}}, [NEW_ID]),
        ({"a2uiClientCapabilities": {"v0.9.1": {"supportedCatalogIds": [OLD_ID]}}}, [OLD_ID]),
        (None, None),
        ({"a2uiClientCapabilities": {"v0.9": {"supportedCatalogIds": "not a list"}}}, None),
    ],
)
def test_the_advertised_ids_are_read_keyed_or_flat(metadata, expected):
    assert advertised_catalog_ids(_text_message("hi", metadata)) == expected


def test_each_line_has_its_own_prompt(tmp_path):
    config = _two_line_config(tmp_path)
    old = build_system_prompt(config, line=config.old_catalog_line)
    new = build_system_prompt(config)
    assert "a ConfirmationDialog fronts every proposal" in old
    assert "a ConfirmationDialog fronts every proposal" not in new
    assert OLD_ID in old and OLD_ID not in new


def test_the_agents_instruction_is_the_turns_lines_prompt(tmp_path):
    from a2ui_agent_kit.catalog_lines import bind_turn_line, unbind_turn_line
    from a2ui_agent_kit.modes import build_llm_agent

    config = _two_line_config(tmp_path)
    agent = build_llm_agent(config, "stub")
    lines = catalog_lines(config)
    assert agent.instruction(None) == build_system_prompt(config)
    token = bind_turn_line(lines.old)
    try:
        assert agent.instruction(None) == build_system_prompt(config, line=config.old_catalog_line)
    finally:
        unbind_turn_line(token)


# ---- deterministic -------------------------------------------------------------------


def _deterministic(config) -> DeterministicAgentExecutor:
    return DeterministicAgentExecutor(
        config.build_response, config.build_text_response, lines=catalog_lines(config)
    )


async def test_deterministic_a_text_turn_is_answered_by_the_advertised_line(tmp_path):
    executor = _deterministic(_two_line_config(tmp_path))
    old = await _turn(executor, _text_message("hi", _capabilities(PUBLIC_BASIC_ID, OLD_ID)))
    assert old.a2ui()[0]["createSurface"]["catalogId"] == OLD_ID
    new = await _turn(executor, _text_message("hi", _capabilities(PUBLIC_BASIC_ID, OLD_ID, NEW_ID)))
    assert new.a2ui()[0]["createSurface"]["catalogId"] == NEW_ID


async def test_deterministic_neither_id_named_says_so_and_paints_nothing(tmp_path):
    def unreachable(_):
        raise AssertionError("no answer is built for a client that renders neither id")

    config = _two_line_config(tmp_path, build_text_response=unreachable)
    queue = await _turn(_deterministic(config), _text_message("hi", _capabilities(PUBLIC_BASIC_ID)))
    assert queue.a2ui() == []
    assert queue.texts() == [NOT_SHOWN]


async def test_deterministic_an_action_on_an_old_surface_is_answered_by_the_old_line(tmp_path):
    executor = _deterministic(_two_line_config(tmp_path))
    await _turn(executor, _text_message("hi", _capabilities(OLD_ID)))
    both = _capabilities(PUBLIC_BASIC_ID, NEW_ID, OLD_ID)
    pressed = await _turn(executor, _action_message({"name": "open", "surfaceId": "old-1"}, both))
    assert pressed.a2ui()[1]["updateComponents"]["components"][1]["text"] == "old open"


async def test_deterministic_an_action_on_an_unknown_surface_is_answered_by_the_newer_line(
    tmp_path,
):
    executor = _deterministic(_two_line_config(tmp_path))
    both = _capabilities(NEW_ID, OLD_ID)
    pressed = await _turn(
        executor, _action_message({"name": "open", "surfaceId": "elsewhere"}, both)
    )
    assert pressed.a2ui()[1]["updateComponents"]["components"][1]["text"] == "new open"


# ---- the model's modes ---------------------------------------------------------------


def _model_text(messages: list[dict]) -> str:
    return "<a2ui-json>\n" + json.dumps(messages) + "\n</a2ui-json>"


def _dialog(surface_id: str, catalog_id: str) -> list[dict]:
    action = {"event": {"name": "confirm"}}
    return [
        {"version": "v0.9", "createSurface": {"surfaceId": surface_id, "catalogId": catalog_id}},
        {
            "version": "v0.9",
            "updateComponents": {
                "surfaceId": surface_id,
                "components": [
                    {
                        "id": "root",
                        "component": "ConfirmationDialog",
                        "title": "Go?",
                        "confirmAction": action,
                        "cancelAction": action,
                    }
                ],
            },
        },
    ]


class _Responder:
    """Answers each attempt from a script, noting the line bound and the prompt it saw."""

    def __init__(self, scripts: list[str]):
        self._scripts = scripts
        self.lines: list[str | None] = []
        self.prompts: list[str] = []
        self.corrections: list[str | None] = []

    async def stream(self, prompt, correction=None, context_id=None):
        line = turn_line()
        self.lines.append(line and _catalog_id_of(line))
        self.prompts.append(prompt)
        self.corrections.append(correction)
        yield self._scripts[min(len(self.prompts) - 1, len(self._scripts) - 1)]


def _catalog_id_of(line: CatalogLine) -> str:
    return json.loads(line.catalog_path.read_text(encoding="utf-8"))["catalogId"]


async def test_model_a_text_turn_runs_on_the_advertised_lines_prompt_and_catalog(tmp_path):
    config = _two_line_config(tmp_path)
    # The old catalog's dialog: valid only on the old line.
    responder = _Responder([_model_text(_dialog("d1", OLD_ID))])
    queue = await _turn(
        LlmAgentExecutor(responder, config), _text_message("hi", _capabilities(OLD_ID))
    )
    assert responder.lines == [OLD_ID]
    assert responder.corrections == [None]
    assert queue.a2ui()[0]["createSurface"]["catalogId"] == OLD_ID


async def test_model_a_turn_on_the_newer_line_does_not_take_the_old_catalogs_components(tmp_path):
    config = _two_line_config(tmp_path)
    responder = _Responder(
        [_model_text(_dialog("d1", NEW_ID)), _model_text(_surface("s1", NEW_ID, "ok"))]
    )
    await _turn(
        LlmAgentExecutor(responder, config), _text_message("hi", _capabilities(NEW_ID, OLD_ID))
    )
    assert responder.lines == [NEW_ID, NEW_ID]
    assert responder.corrections[1] is not None


async def test_model_every_created_surface_carries_the_turns_catalog_id(tmp_path):
    # Earlier turns in the other line sit in the conversation; the id the model copies
    # from them is not the one the turn paints in.
    config = _two_line_config(tmp_path)
    responder = _Responder([_model_text(_surface("s1", OLD_ID, "hello"))])
    queue = await _turn(
        LlmAgentExecutor(responder, config), _text_message("hi", _capabilities(NEW_ID, OLD_ID))
    )
    assert queue.a2ui()[0]["createSurface"]["catalogId"] == NEW_ID


async def test_model_neither_id_named_says_so_without_calling_the_model(tmp_path):
    responder = _Responder([_model_text(_surface("s1", NEW_ID, "hello"))])
    queue = await _turn(
        LlmAgentExecutor(responder, _two_line_config(tmp_path)),
        _text_message("hi", _capabilities(PUBLIC_BASIC_ID)),
    )
    assert responder.prompts == []
    assert queue.a2ui() == []
    assert queue.texts() == [NOT_SHOWN]


async def test_model_an_action_on_an_old_surface_runs_on_the_old_line(tmp_path):
    config = _two_line_config(tmp_path)
    responder = _Responder([_model_text(_dialog("d1", OLD_ID))])
    executor = LlmAgentExecutor(responder, config)
    await _turn(executor, _text_message("hi", _capabilities(OLD_ID)))
    both = _capabilities(NEW_ID, OLD_ID)
    await _turn(executor, _action_message({"name": "confirm", "surfaceId": "d1"}, both))
    assert responder.lines == [OLD_ID, OLD_ID]


async def test_model_an_action_on_a_surface_no_longer_advertised_is_answered_as_a_fresh_surface(
    tmp_path,
):
    config = _two_line_config(tmp_path)
    in_place = [
        {
            "version": "v0.9",
            "updateComponents": {
                "surfaceId": "d1",
                "components": [{"id": "root", "component": "Text", "text": "done"}],
            },
        }
    ]
    responder = _Responder(
        [
            _model_text(_dialog("d1", OLD_ID)),
            _model_text(in_place),
            _model_text(_surface("after", NEW_ID, "done")),
        ]
    )
    executor = LlmAgentExecutor(responder, config)
    await _turn(executor, _text_message("hi", _capabilities(OLD_ID)))
    queue = await _turn(
        executor, _action_message({"name": "confirm", "surfaceId": "d1"}, _capabilities(NEW_ID))
    )
    assert responder.lines[1:] == [NEW_ID, NEW_ID]
    assert "a new surface" in responder.prompts[1]
    assert responder.corrections[2] is not None and "new surface" in responder.corrections[2]
    created = [m["createSurface"] for m in queue.a2ui() if "createSurface" in m]
    assert created == [{"surfaceId": "after", "catalogId": NEW_ID}]
