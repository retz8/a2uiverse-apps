"""The store's A2UI, built from the dataset — the one place a surface is composed.

Three surfaces, and the prose pins the two the wiring's refs address (decision 14):
`list` carries the products at `/items`, `policy` carries text and no array. The
drill-down replaces `list`'s root, so `/items` stops resolving on the surface the refs
already point at, and the back control restores it (decision 10). Neither instrument
creates a surface; both are updates to one that already exists.
"""

from __future__ import annotations

from a2ui_agent_kit.versions import WIRE_VERSION

from app import dataset
from app.card import STORE_BRAND

LIST_SURFACE = "list"
POLICY_SURFACE = "policy"


def _msg(op: str, payload: dict) -> dict:
    return {"version": WIRE_VERSION, op: payload}


def create(surface_id: str, catalog_id: str) -> dict:
    return _msg(
        "createSurface",
        {"surfaceId": surface_id, "catalogId": catalog_id, "sendDataModel": True},
    )


def data(surface_id: str, value: dict, path: str = "/") -> dict:
    return _msg("updateDataModel", {"surfaceId": surface_id, "path": path, "value": value})


def components(surface_id: str, tree: list[dict]) -> dict:
    return _msg("updateComponents", {"surfaceId": surface_id, "components": tree})


def list_tree() -> list[dict]:
    """The catalogue: a sortable list of rows, each row its own drill-down target."""
    return [
        {"id": "root", "component": "Card", "child": "body"},
        {"id": "body", "component": "Column", "children": ["title", "controls", "rows"]},
        {"id": "title", "component": "Text", "variant": "h3", "text": STORE_BRAND},
        {"id": "controls", "component": "Row", "children": ["sort-price", "sort-rating"]},
        {
            "id": "sort-price",
            "component": "Button",
            "variant": "borderless",
            "child": "sort-price-label",
            "action": {"event": {"name": "sort-by", "context": {"key": "price"}}},
        },
        {"id": "sort-price-label", "component": "Text", "text": "Price"},
        {
            "id": "sort-rating",
            "component": "Button",
            "variant": "borderless",
            "child": "sort-rating-label",
            "action": {"event": {"name": "sort-by", "context": {"key": "rating"}}},
        },
        {"id": "sort-rating-label", "component": "Text", "text": "Rating"},
        {"id": "rows", "component": "List", "children": {"path": "/items", "componentId": "row"}},
        {
            "id": "row",
            "component": "Button",
            "variant": "borderless",
            "child": "row-body",
            # The row's own id rides the event, so every row carries the same action
            # pointed at its own camera.
            "action": {"event": {"name": "open-camera", "context": {"cameraId": {"path": "id"}}}},
        },
        {
            "id": "row-body",
            "component": "Row",
            "children": ["row-name", "row-price", "row-rating"],
        },
        {"id": "row-name", "component": "Text", "text": {"path": "name"}},
        {"id": "row-price", "component": "Text", "text": {"path": "price"}},
        {"id": "row-rating", "component": "Text", "variant": "caption", "text": {"path": "rating"}},
    ]


def detail_tree() -> list[dict]:
    """The drill-down. Same surface, same root id: only the content changes."""
    return [
        {"id": "root", "component": "Card", "child": "body"},
        {
            "id": "body",
            "component": "Column",
            "children": ["detail-name", "detail-blurb", "detail-figures", "back"],
        },
        {"id": "detail-name", "component": "Text", "variant": "h3", "text": {"path": "/detail/name"}},
        {"id": "detail-blurb", "component": "Text", "text": {"path": "/detail/blurb"}},
        {
            "id": "detail-figures",
            "component": "Row",
            "children": ["detail-price", "detail-rating"],
        },
        {"id": "detail-price", "component": "Text", "text": {"path": "/detail/price"}},
        {
            "id": "detail-rating",
            "component": "Text",
            "variant": "caption",
            "text": {"path": "/detail/rating"},
        },
        {
            "id": "back",
            "component": "Button",
            "variant": "primary",
            "child": "back-label",
            "action": {"event": {"name": "back-to-list", "context": {"from": "detail"}}},
        },
        {"id": "back-label", "component": "Text", "text": "Back to the list"},
    ]


def policy_tree() -> list[dict]:
    """Text and no array: the surface the Synthesizer must look at and reject."""
    return [
        {"id": "root", "component": "Card", "child": "body"},
        {"id": "body", "component": "Column", "children": ["policy-title", "policy-text"]},
        {"id": "policy-title", "component": "Text", "variant": "h3", "text": "Shipping and returns"},
        {"id": "policy-text", "component": "Text", "text": {"path": "/policy"}},
    ]


def paint_list(catalog_id: str, items: list[dict]) -> list[dict]:
    return [
        create(LIST_SURFACE, catalog_id),
        data(LIST_SURFACE, {"items": items}),
        components(LIST_SURFACE, list_tree()),
    ]


def paint_policy(catalog_id: str) -> list[dict]:
    return [
        create(POLICY_SURFACE, catalog_id),
        data(POLICY_SURFACE, {"policy": dataset.policy()}),
        components(POLICY_SURFACE, policy_tree()),
    ]


def show_detail(camera: dict, surface_id: str = LIST_SURFACE) -> list[dict]:
    """The drill-down instrument: the products array stops resolving, and comes back."""
    return [
        data(surface_id, {"detail": camera}),
        components(surface_id, detail_tree()),
    ]


def show_list(items: list[dict], surface_id: str = LIST_SURFACE) -> list[dict]:
    return [
        data(surface_id, {"items": items}),
        components(surface_id, list_tree()),
    ]


def reorder(items: list[dict], surface_id: str = LIST_SURFACE) -> list[dict]:
    """The reorder instrument: the same array, same length, different order — which is
    exactly what bumps the partition's generation."""
    return [data(surface_id, items, path="/items")]
