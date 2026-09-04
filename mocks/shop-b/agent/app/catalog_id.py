"""The catalog id this store's surfaces are created against.

Read from the checked-in catalog.json rather than repeated here, so the id has one
author — the catalog package — exactly as it does for the client and the manifest.
"""

from __future__ import annotations

import functools
import json
from pathlib import Path

_CATALOG_PATH = (
    Path(__file__).resolve().parents[2] / "shop-b-catalog" / "catalogs" / "v0.9.1" / "catalog.json"
)


@functools.lru_cache(maxsize=1)
def _catalog_id() -> str:
    return json.loads(_CATALOG_PATH.read_text(encoding="utf-8"))["catalogId"]


CATALOG_ID = _catalog_id()
