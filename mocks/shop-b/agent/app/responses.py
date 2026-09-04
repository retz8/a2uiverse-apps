"""Deterministic mode: an action or a prompt to A2UI, built from the dataset.

No fixture files (decision 4). A deterministic reorder sorts the same rows the live tool
would sort, so the two modes cannot disagree about what an instrument does — which is
what lets deterministic stand in for live in beats and tests.

Deterministic mode is stateless, so each response is computed from the dataset rather
than from what a previous turn left behind: a sort is the catalogue in that order, and
`back-to-list` is the catalogue in its authored order.
"""

from __future__ import annotations

from app import dataset, surfaces
from app.catalog_id import CATALOG_ID

# The action names this store's surfaces fire. Anything else falls through to the kit's
# visible "unhandled" response rather than a silent no-op.
ACTIONS = ("open-camera", "back-to-list", "sort-by")


def build_response(action: dict) -> list[dict]:
    name = action.get("name", "")
    context = action.get("context") or {}
    # Echo the surface the action targeted, as the kit's own responder does.
    surface_id = action.get("surfaceId") or surfaces.LIST_SURFACE
    if name == "open-camera":
        camera = dataset.detail(str(context.get("cameraId", "")))
        if camera is None:
            return _unhandled(f"Unhandled event: no such camera {context.get('cameraId')!r}", surface_id)
        return surfaces.show_detail(camera, surface_id)
    if name == "back-to-list":
        return surfaces.show_list(dataset.catalogue(), surface_id)
    if name == "sort-by":
        key = str(context.get("key", "price"))
        if key not in dataset.SORT_KEYS:
            return _unhandled(f"Unhandled event: cannot sort by {key!r}", surface_id)
        return surfaces.reorder(dataset.sorted_catalogue(key), surface_id)
    return _unhandled(f"Unhandled event: {name}", surface_id)


def build_text_response(text: str) -> list[dict]:
    """Any prompt paints the catalogue, except one that asks about the policy.

    The text path is not a router — the live modes are where intent is read — but the
    policy surface is the one thing a caller must be able to reach deterministically,
    since it is what makes a decline reproducible (decision 12).
    """
    if _asks_for_policy(text):
        return surfaces.paint_policy(CATALOG_ID)
    return surfaces.paint_list(CATALOG_ID, dataset.catalogue())


_POLICY_WORDS = ("polic", "return", "shipping", "delivery", "dispatch", "warrant")


def _asks_for_policy(text: str) -> bool:
    lowered = text.lower()
    return any(word in lowered for word in _POLICY_WORDS)


def _unhandled(message: str, surface_id: str) -> list[dict]:
    """Visible, rather than a silent no-op that looks like a round-trip changing nothing."""
    return [
        surfaces.components(surface_id, [{"id": "root", "component": "Text", "text": message}])
    ]
