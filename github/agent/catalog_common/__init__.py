"""Shared catalog locate/load for both the deterministic and live agents.

Holds the app-root locator, the sibling github-catalog's catalog path, and the
A2uiSchemaManager construction. Validation semantics stay per-agent (each agent
imports its own validator wrapper), per the 7.2 spec decision 3.
"""

from __future__ import annotations

import functools
from pathlib import Path

from a2ui.schema.catalog import A2uiCatalog, CatalogConfig
from a2ui.schema.constants import VERSION_0_9
from a2ui.schema.manager import A2uiSchemaManager

_CATALOG_RELPATH = ("github-catalog", "catalogs", "v0.9.1", "catalog.json")


def _app_root() -> Path:
    # catalog_common/__init__.py -> catalog_common -> agent -> <app root: github/>
    root = Path(__file__).resolve().parents[2]
    assert (root / "github-catalog").is_dir(), (
        f"expected the app root containing github-catalog at {root}"
    )
    return root


def catalog_json_path() -> Path:
    path = _app_root().joinpath(*_CATALOG_RELPATH)
    assert path.is_file(), f"catalog.json not found at {path}"
    return path


def build_schema_manager(examples_path: str | None = None) -> A2uiSchemaManager:
    """Constructs a v0.9.1 schema manager over the hosted adapter catalog.

    examples_path (a directory or glob) is registered as the catalog's examples
    source; the live agent passes agent/knowledge/examples, the deterministic
    agent passes nothing.
    """
    return A2uiSchemaManager(
        version=VERSION_0_9,
        catalogs=[
            CatalogConfig.from_path("adapter", str(catalog_json_path()), examples_path)
        ],
    )


@functools.lru_cache(maxsize=1)
def _default_schema_manager() -> A2uiSchemaManager:
    return build_schema_manager()


def get_catalog() -> A2uiCatalog:
    return _default_schema_manager().get_selected_catalog()


def supported_catalog_ids() -> list[str]:
    return [get_catalog().catalog_id]
