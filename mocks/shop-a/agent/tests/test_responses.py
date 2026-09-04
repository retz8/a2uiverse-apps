"""Deterministic mode: the catalogue, the policy, and the two instruments.

The instruments are what this store exists for, so what they emit is pinned here
(task-4.6 decision 18): a drill-down must make the products array stop resolving, and a
reorder must change that array's order and nothing else. Those are precisely the two
shapes the orchestrator's generation rule discriminates between — missing is free,
same-array-different-contents is a re-synthesis.
"""

from __future__ import annotations

import pytest

from a2ui_agent_kit.catalog import catalog_context

from app import dataset, surfaces
from app.config import CONFIG
from app.responses import ACTIONS, build_response, build_text_response

validate_payload = catalog_context(CONFIG).validate_payload


def _action(name: str, surface_id: str = "list", **context) -> dict:
    return {"name": name, "surfaceId": surface_id, "context": context}


def _ops(messages: list[dict]) -> list[str]:
    return [next(k for k in m if k != "version") for m in messages]


def _data(messages: list[dict]) -> dict:
    return next(m["updateDataModel"] for m in messages if "updateDataModel" in m)


class TestTextPath:
    def test_a_prompt_paints_the_catalogue_on_the_pinned_surface(self):
        messages = build_text_response("what cameras do you have")
        assert _ops(messages) == ["createSurface", "updateDataModel", "updateComponents"]
        assert messages[0]["createSurface"]["surfaceId"] == "list"
        assert messages[0]["createSurface"]["sendDataModel"] is True
        assert _data(messages)["value"]["items"] == dataset.catalogue()

    def test_the_pinned_surface_id_is_stable_across_prompts(self):
        # A regression bed's refs address this id; it is a contract, not a per-turn name.
        first = build_text_response("a")[0]["createSurface"]["surfaceId"]
        second = build_text_response("b")[0]["createSurface"]["surfaceId"]
        assert first == second == surfaces.LIST_SURFACE

    def test_a_policy_question_paints_the_policy_surface_with_no_array(self):
        messages = build_text_response("what is your returns policy?")
        assert messages[0]["createSurface"]["surfaceId"] == "policy"
        value = _data(messages)["value"]
        assert value == {"policy": dataset.policy()}
        assert not any(isinstance(v, list) for v in value.values())

    def test_both_surfaces_are_catalog_conformant(self):
        validate_payload(build_text_response("anything"))
        validate_payload(build_text_response("shipping?"))


class TestDrillDown:
    """Absent, and free: the array stops resolving, and comes back (decision 10)."""

    def test_opening_a_camera_replaces_the_root_and_creates_no_surface(self):
        messages = build_response(_action("open-camera", cameraId=dataset.catalogue()[0]["id"]))
        assert _ops(messages) == ["updateDataModel", "updateComponents"]
        payload = _data(messages)
        assert payload["path"] == "/"
        assert "items" not in payload["value"]
        assert payload["value"]["detail"]["blurb"]

    def test_going_back_restores_the_authored_order(self):
        messages = build_response(_action("back-to-list"))
        assert _ops(messages) == ["updateDataModel", "updateComponents"]
        assert _data(messages)["value"] == {"items": dataset.catalogue()}

    def test_an_unstocked_camera_is_visibly_unhandled(self):
        messages = build_response(_action("open-camera", cameraId="no-such-camera"))
        assert "Unhandled event" in str(messages)


class TestReorder:
    """Invalid, and re-synthesized: the same array, new order (decision 9)."""

    @pytest.mark.parametrize("key", dataset.SORT_KEYS)
    def test_sorting_writes_the_array_back_in_place(self, key):
        messages = build_response(_action("sort-by", key=key))
        assert _ops(messages) == ["updateDataModel"]
        payload = _data(messages)
        assert payload["path"] == "/items"
        assert payload["value"] == dataset.sorted_catalogue(key)

    @pytest.mark.parametrize("key", dataset.SORT_KEYS)
    def test_sorting_changes_only_the_order(self, key):
        before = dataset.catalogue()
        after = _data(build_response(_action("sort-by", key=key)))["value"]
        assert len(after) == len(before)
        assert {row["id"] for row in after} == {row["id"] for row in before}
        assert sorted(map(repr, after)) == sorted(map(repr, before))

    @pytest.mark.parametrize("key", dataset.SORT_KEYS)
    def test_the_reorder_actually_reorders(self, key):
        # A sort that moved nothing would write an identical array, bump no generation,
        # and leave the instrument dead. The dataset is authored so neither key is a
        # no-op for either store.
        assert _data(build_response(_action("sort-by", key=key)))["value"] != dataset.catalogue()

    def test_an_unknown_key_is_visibly_unhandled(self):
        assert "Unhandled event" in str(build_response(_action("sort-by", key="colour")))


class TestActionSurface:
    @pytest.mark.parametrize("name", ACTIONS)
    def test_each_action_has_a_response(self, name):
        messages = build_response(_action(name, cameraId=dataset.catalogue()[0]["id"], key="price"))
        assert messages
        assert "Unhandled event" not in str(messages)

    @pytest.mark.parametrize("name", ACTIONS)
    def test_each_response_echoes_the_surface_it_targets(self, name):
        messages = build_response(
            _action(name, "surface-42", cameraId=dataset.catalogue()[0]["id"], key="price")
        )
        for message in messages:
            for key in ("updateComponents", "updateDataModel", "createSurface"):
                if key in message:
                    assert message[key]["surfaceId"] == "surface-42"

    @pytest.mark.parametrize("name", ACTIONS)
    def test_each_response_is_catalog_conformant(self, name):
        validate_payload(
            build_response(_action(name, cameraId=dataset.catalogue()[0]["id"], key="price"))
        )

    def test_an_unknown_event_is_visibly_unhandled(self):
        # A silent no-op looks like a working round-trip that changed nothing.
        assert "Unhandled event: no-such-event" in str(build_response(_action("no-such-event")))
