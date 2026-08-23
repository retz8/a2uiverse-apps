"""Deterministic-agent catalog access: shared locate/load + fixture-specific validation."""

from __future__ import annotations

import copy

from catalog_common import (
    build_schema_manager,
    catalog_json_path,
    get_catalog,
    supported_catalog_ids,
)

__all__ = [
    "build_schema_manager",
    "catalog_json_path",
    "get_catalog",
    "supported_catalog_ids",
    "validate_payload",
]


def validate_payload(payload: list[dict]) -> None:
    """Raises if the payload's components do not conform to the Primer catalog.

    `id` is the framework-owned component envelope field (not modeled by the
    catalog, like the JS parity test's excluded ['component', 'id']); it is
    stripped before validation. strict_integrity=False skips root/orphan
    topology checks, since the surface root lives in the client fixture, not
    the server's partial update.
    """
    probe = copy.deepcopy(payload)
    for message in probe:
        update = message.get("updateComponents")
        if isinstance(update, dict):
            for component in update.get("components", []):
                component.pop("id", None)
    get_catalog().validator.validate(probe, strict_integrity=False)
