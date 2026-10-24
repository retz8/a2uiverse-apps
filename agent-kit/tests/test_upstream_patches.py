"""The kit's local fixes over the pinned upstream releases (a2ui_agent_kit.upstream_patches)."""

import pytest
from a2ui.core import A2uiValidationError
from a2ui.core.basic_catalog import BasicCatalog
from a2ui.utils import validate_payload

import a2ui_agent_kit.upstream_patches  # noqa: F401 — applied at import

CATALOG = BasicCatalog("0.9")


def _surface(components: list[dict]) -> list[dict]:
    return [
        {"version": "v0.9", "createSurface": {"surfaceId": "s", "catalogId": CATALOG.catalog_id}},
        {"version": "v0.9", "updateComponents": {"surfaceId": "s", "components": components}},
    ]


def test_a_leaf_prop_naming_a_component_id_is_not_a_child_reference():
    # Finding 16: `a2ui-core` 0.4.0 read an Icon named "mail" inside the row whose id is
    # `mail` as a child of that Icon, and refused the surface as a cycle.
    validate_payload(
        [CATALOG],
        _surface(
            [
                {"id": "root", "component": "Row", "children": ["mail"]},
                {"id": "mail", "component": "Row", "children": ["mail-icon"]},
                {"id": "mail-icon", "component": "Icon", "name": "mail"},
            ]
        ),
    )


def test_the_declared_child_references_still_make_a_cycle():
    with pytest.raises(A2uiValidationError):
        validate_payload(
            [CATALOG],
            _surface(
                [
                    {"id": "root", "component": "Row", "children": ["a"]},
                    {"id": "a", "component": "Row", "children": ["root"]},
                ]
            ),
        )
