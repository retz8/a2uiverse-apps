"""The deterministic mode's canned responses: the text path and the action map."""

from __future__ import annotations

import pytest

from a2ui_agent_kit.catalog import catalog_context

from app.config import CONFIG
from app.responses import EVENT_FIXTURES, build_response, build_text_response

validate_payload = catalog_context(CONFIG).validate_payload

ACTIONS = sorted(EVENT_FIXTURES)


def _action(name: str, surface_id: str = "s-1") -> dict:
    return {"name": name, "surfaceId": surface_id, "context": {}}


def _ops(messages: list[dict]) -> list[str]:
    return [next(k for k in m if k != "version") for m in messages]


class TestTextPath:
    def test_a_prompt_returns_the_canned_surface(self):
        messages = build_text_response("Say hello")
        assert "createSurface" in _ops(messages)
        assert any("updateComponents" in m for m in messages)

    def test_the_surface_is_catalog_conformant(self):
        validate_payload(build_text_response("anything"))

    def test_every_prompt_gets_its_own_surface(self):
        # A surfaceId may not be re-created on the client, and the executor is stateless.
        first = build_text_response("a")[0]["createSurface"]["surfaceId"]
        second = build_text_response("b")[0]["createSurface"]["surfaceId"]
        assert first != second


class TestActionPath:
    @pytest.mark.parametrize("name", ACTIONS)
    def test_each_action_has_a_canned_response(self, name):
        messages = build_response(_action(name))
        assert messages
        assert "Unhandled event" not in str(messages)

    @pytest.mark.parametrize("name", ACTIONS)
    def test_each_response_echoes_the_surface_it_targets(self, name):
        for message in build_response(_action(name, "surface-42")):
            for key in ("updateComponents", "updateDataModel", "createSurface"):
                if key in message:
                    assert message[key]["surfaceId"] == "surface-42"

    @pytest.mark.parametrize("name", ACTIONS)
    def test_each_response_is_catalog_conformant(self, name):
        validate_payload(build_response(_action(name)))

    def test_an_unknown_event_is_visibly_unhandled(self):
        # A silent no-op looks like a working round-trip that changed nothing.
        messages = build_response(_action("no-such-event"))
        assert "Unhandled event: no-such-event" in str(messages)
