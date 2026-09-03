"""The deterministic agent as composition harness (task-2.6 decision 11).

Its job is not per-component coverage — the client owns that with its synthetic beats — but
answering the fan-out utterance and the four beats' actions with no LLM call and no Calendar
quota, so plan/fill/collapse can be iterated on in seconds.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from a2ui_agent_kit.catalog import catalog_context

from app.config import CONFIG
from app.responses import build_response, build_text_response

validate_payload = catalog_context(CONFIG).validate_payload

ACTIONS = ("open-event", "confirm-event", "rsvp-toggle", "cancel-event")

# The canned corpus is derived from a live recording run, so it does not exist until one has
# happened and been verified publishable. These skip rather than assert against stand-in data
# authored to satisfy them — which is the thing decision 11 exists to prevent.
requires_corpus = pytest.mark.skipif(
    not (
        Path(__file__).resolve().parents[1]
        / "app"
        / "fixtures"
        / "deterministic"
        / "agenda-digest.json"
    ).is_file(),
    reason="deterministic corpus not recorded yet (see agent/README.md)",
)


def _action(name: str, surface_id: str = "s-1") -> dict:
    return {"name": name, "surfaceId": surface_id, "context": {}}


def _ops(messages: list[dict]) -> list[str]:
    return [next(k for k in m if k != "version") for m in messages]


@requires_corpus
class TestTextPath:
    def test_a_prompt_returns_the_canned_digest(self):
        messages = build_text_response("What needs my attention today?")
        assert "createSurface" in _ops(messages)
        assert any("updateComponents" in m for m in messages)

    def test_the_digest_is_catalog_conformant(self):
        validate_payload(build_text_response("anything"))

    def test_every_prompt_gets_its_own_surface(self):
        # A surfaceId may not be re-created on the client, and the executor is stateless.
        first = build_text_response("a")[0]["createSurface"]["surfaceId"]
        second = build_text_response("b")[0]["createSurface"]["surfaceId"]
        assert first != second

    def test_it_does_not_route_on_the_utterance(self):
        # Discriminating here would be a second, worse router; the live agent reads intent.
        a = build_text_response("What needs my attention today?")
        b = build_text_response("something else entirely")
        assert _ops(a) == _ops(b)


@requires_corpus
class TestActionPath:
    @pytest.mark.parametrize("name", ACTIONS)
    def test_each_beat_action_has_a_canned_response(self, name):
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

    def test_an_action_response_never_creates_a_surface(self):
        # It is a partial update against a surface the client already holds.
        for name in ACTIONS:
            assert "createSurface" not in _ops(build_response(_action(name)))

    def test_an_unknown_event_is_visibly_unhandled(self):
        # A silent no-op looks like a working round-trip that changed nothing.
        messages = build_response(_action("no-such-event"))
        assert "Unhandled event: no-such-event" in str(messages)
