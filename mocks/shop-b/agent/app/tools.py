"""The store's tools for the two LLM modes.

Both modes hold the same four tools over the same dataset; they differ in whether a
write lands (decision 13). Live sorts a listing it keeps, so a reorder genuinely
reorders. Stub acknowledges the sort and returns the listing unchanged, which is the
kit's stub semantics and leaves stub meaning "the model paints, the instruments are
inert".

There is no MCP behind an invented store, so `live` is plain callables rather than a
toolset — which the kit accepts as of task-4.6 decision 16.
"""

from __future__ import annotations

from app import dataset
from app.store import LIVE_LISTING, STUB_LISTING


def _tools(listing, *, mutable: bool) -> list:
    def list_cameras() -> dict:
        """Lists the cameras this store currently stocks, in the store's own order.

        Returns:
            An object with an `items` list of cameras, each with `id`, `name`, `price`
            and `rating`.
        """
        return {"items": listing.items}

    def open_camera(camera_id: str) -> dict:
        """Fetches one camera in full, including its description.

        Args:
            camera_id: The camera's id, as carried by a row in the list.

        Returns:
            An object with a `detail` object, or an `error` string when the store does
            not stock that camera.
        """
        camera = dataset.detail(camera_id)
        if camera is None:
            return {"error": f"this store does not stock {camera_id}"}
        return {"detail": camera}

    def sort_cameras(key: str) -> dict:
        """Reorders the stocked cameras by price or rating.

        Args:
            key: Either "price" (cheapest first) or "rating" (best first).

        Returns:
            An object with the reordered `items` list, and `applied` saying whether the
            new order was kept.
        """
        if key not in dataset.SORT_KEYS:
            return {"error": f"cannot sort by {key!r}", "items": listing.items}
        return {"items": listing.sort(key), "applied": mutable}

    def store_policy() -> dict:
        """Fetches this store's shipping, returns and warranty terms.

        Returns:
            An object with a `policy` string.
        """
        return {"policy": dataset.policy()}

    return [list_cameras, open_camera, sort_cameras, store_policy]


STUB_TOOLS = _tools(STUB_LISTING, mutable=False)
LIVE_TOOLS = _tools(LIVE_LISTING, mutable=True)
