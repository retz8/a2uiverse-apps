"""Conformance gate for the curated example surfaces in `app/knowledge/examples/`.

Each example file is a named-field envelope `{name, intent, messages}` whose `messages` is an
A2UI message sequence in the exact wire format the live agent must emit, so an example carrying
an unresolvable binding or an orphaned component cannot teach the model that defect.

Two kinds of example, and each gets the validator that fits it. One creates a surface and is
checked whole, root and all. The others are UPDATE-ONLY turns — the shape every turn after the
first paint takes here (task-4.6 decision 10) — and are checked for conformance, since
`validate_surface` requires a createSurface by definition and an update-only turn has none.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from a2ui_agent_kit.catalog import catalog_context

from app.config import CONFIG

_context = catalog_context(CONFIG)
validate_surface = _context.validate_surface
validate_payload = _context.validate_payload

_EXAMPLES_DIR = Path(__file__).resolve().parents[1] / "app" / "knowledge" / "examples"
_EXAMPLE_FILES = sorted(_EXAMPLES_DIR.glob("*.json"))


def test_there_is_at_least_one_example():
    assert _EXAMPLE_FILES, f"no example surfaces in {_EXAMPLES_DIR}"


@pytest.mark.parametrize("path", _EXAMPLE_FILES, ids=lambda p: p.stem)
def test_example_envelope_shape(path: Path):
    example = json.loads(path.read_text(encoding="utf-8"))
    assert set(example) >= {"name", "intent", "messages"}, (
        f"{path.name}: envelope must carry name, intent, messages"
    )
    assert isinstance(example["name"], str) and example["name"]
    assert isinstance(example["intent"], str) and example["intent"]
    assert isinstance(example["messages"], list) and example["messages"]


@pytest.mark.parametrize("path", _EXAMPLE_FILES, ids=lambda p: p.stem)
def test_example_messages_conform_to_catalog(path: Path):
    example = json.loads(path.read_text(encoding="utf-8"))
    messages = example["messages"]
    creates = any("createSurface" in m for m in messages)
    (validate_surface if creates else validate_payload)(messages)  # must not raise


def test_exactly_one_example_creates_a_surface():
    """The model copies example shape. If every example painted from scratch, it would
    never learn the update-only turn the instruments depend on."""
    creating = [
        p.stem
        for p in _EXAMPLE_FILES
        if any("createSurface" in m for m in json.loads(p.read_text(encoding="utf-8"))["messages"])
    ]
    assert creating == ["catalogue"]
