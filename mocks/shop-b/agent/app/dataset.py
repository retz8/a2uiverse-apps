"""The mock tier's shared dataset, sliced for this store.

Every mode reads from here (task-4.6 decisions 3 and 4): there are no fixture files.
Product identity — id, name, blurb — is shared, so the two stores cannot disagree about
what a camera is; price, rating, stocked subset and listing order are this store's own.
The file sits above the agent because it is the tier's, not the app's, which is a
self-containment a vendor app has and a mock deliberately does not.
"""

from __future__ import annotations

import functools
import json
from pathlib import Path

STORE_ID = "shop-b"

# mocks/<store>/agent/app/dataset.py -> mocks/dataset/products.json
DATASET_PATH = Path(__file__).resolve().parents[3] / "dataset" / "products.json"


@functools.lru_cache(maxsize=1)
def _dataset() -> dict:
    return json.loads(DATASET_PATH.read_text(encoding="utf-8"))


def _products() -> dict[str, dict]:
    return {p["id"]: p for p in _dataset()["products"]}


def catalogue() -> list[dict]:
    """This store's listing as the items the surface binds: identity joined to values.

    The order is the store's own, as authored. Indices deliberately do not line up with
    the other store's (decision 2), so a wiring's index refs carry real information.
    """
    products = _products()
    items = []
    for entry in _dataset()["stores"][STORE_ID]["listing"]:
        product = products[entry["id"]]
        items.append(
            {
                "id": product["id"],
                "name": product["name"],
                "price": entry["price"],
                "rating": entry["rating"],
            }
        )
    return items


def detail(camera_id: str) -> dict | None:
    """One camera as the drill-down shows it: the listing values plus the shared blurb."""
    products = _products()
    for item in catalogue():
        if item["id"] == camera_id:
            return {**item, "blurb": products[item["id"]]["blurb"]}
    return None


def policy() -> str:
    """The store's shipping and returns copy — the non-product capability (decision 12)."""
    return _dataset()["stores"][STORE_ID]["policy"]


SORT_KEYS = ("price", "rating")


def sorted_catalogue(key: str, items: list[dict] | None = None) -> list[dict]:
    """The catalogue reordered in place. Price ascends; rating descends — each key sorted
    the way a shopper means it."""
    if key not in SORT_KEYS:
        raise ValueError(f"unknown sort key {key!r}; expected one of {SORT_KEYS}")
    rows = list(items if items is not None else catalogue())
    return sorted(rows, key=lambda row: row[key], reverse=key == "rating")
