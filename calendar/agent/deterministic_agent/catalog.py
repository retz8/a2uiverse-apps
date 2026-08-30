"""Deterministic-agent catalog access: shared locate/load + fixture-specific validation."""

from __future__ import annotations

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
    """Raises if the payload's components do not conform to the Calendar catalog.

    Unlike the GitHub agent, `id` is NOT stripped before validation: Primer's hand-written
    catalog does not model `id`, but the basic catalog does — every component `$ref`s
    ComponentCommon, where it is required — so stripping it would fail every component.

    strict_integrity=False skips root/orphan topology checks, since a canned action response
    is a partial update against a surface the client already holds.
    """
    get_catalog().validator.validate(payload, strict_integrity=False)
