"""The prose states the pins the synthesis wiring's refs depend on (decision 18).

A wiring addresses `<store>:list` at `/items`; if the prompt stops saying so, an LLM-mode
turn is free to paint something the refs cannot reach, and the failure would surface far
away as a malformed synthesis. So the pins are asserted where they are authored.
"""

from __future__ import annotations

import pytest

from app import prose, surfaces

PINS = prose.SURFACE_DESCRIPTION


def test_the_module_and_the_prose_name_the_same_surfaces():
    assert surfaces.LIST_SURFACE == "list"
    assert surfaces.POLICY_SURFACE == "policy"
    assert '"list"' in PINS and '"policy"' in PINS


def test_the_prose_pins_the_products_path_and_its_keys():
    assert '"/items"' in PINS
    for key in ("id", "name", "price", "rating"):
        assert f'"{key}"' in PINS


def test_the_prose_pins_the_policy_path_and_says_it_carries_no_array():
    assert '"/policy"' in PINS
    assert "no array" in PINS


def test_the_prose_keeps_price_and_rating_numeric():
    # A formatted string would make min/max over the two stores impossible.
    assert "never formatted" in PINS


def test_the_prose_forbids_re_creating_a_live_surface():
    # An instrument turn that re-creates its surface tears down everything bound to it,
    # and would leave the generation rule comparing a fresh object rather than the one
    # the wiring's refs point at.
    assert "AT MOST ONCE" in PINS
    assert "NO createSurface" in PINS


def test_the_prose_states_both_instruments_are_updates_to_the_same_surface():
    assert "update-only turns" in PINS
    assert '"/detail"' in PINS


@pytest.mark.parametrize("tree", [surfaces.list_tree(), surfaces.detail_tree(), surfaces.policy_tree()])
def test_every_tree_roots_at_the_id_the_renderer_expects(tree):
    assert tree[0]["id"] == "root"


def test_the_catalogue_binds_its_rows_by_template_with_relative_paths():
    by_id = {c["id"]: c for c in surfaces.list_tree()}
    assert by_id["rows"]["children"] == {"path": "/items", "componentId": "row"}
    assert by_id["row-name"]["text"] == {"path": "name"}
    # Every row carries the same action pointed at its own camera.
    assert by_id["row"]["action"]["event"]["context"] == {"cameraId": {"path": "id"}}
