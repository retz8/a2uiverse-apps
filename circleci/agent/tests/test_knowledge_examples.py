"""Conformance gate for the curated example surfaces in `app/knowledge/examples/`.

Each example file is a named-field envelope `{name, intent, messages}` whose `messages` is a
complete A2UI message sequence in the exact wire format the live agent must emit. Every one
is validated with the live agent's own `validate_surface`, so an example carrying an
unresolvable binding or an orphaned component cannot teach the model that defect.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from a2ui_agent_kit.catalog import catalog_context

from app.config import CONFIG

validate_surface = catalog_context(CONFIG).validate_surface

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
    validate_surface(example["messages"])  # must not raise
