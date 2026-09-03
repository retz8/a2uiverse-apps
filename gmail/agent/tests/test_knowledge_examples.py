"""Conformance gate for the curated Gmail-domain idiom examples in `agent/app/knowledge/`.

Each example file is a named-field envelope `{name, intent, messages}` whose `messages`
is a complete A2UI message sequence in the exact wire format the live agent must emit.
This test globs the example files and validates every component entry in each sequence
against the shipped Gmail catalog, reusing the deterministic mode's `validate_payload`
(the same probe the emitted-event conformance test uses). It is the phase spec's L0
"examples validated against the catalog schema" check, delivered early (task 7.1).
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

# The set is derived: task 7.7 retires each 7.1 example as an approved beat surface supersedes it
# (spec decision 11). Guard the count so a fold or a retirement is a deliberate edit here rather
# than a silent change in the corpus the model learns from.
_EXPECTED_COUNT = 4


def test_expected_example_count():
    assert len(_EXAMPLE_FILES) == _EXPECTED_COUNT, (
        f"expected {_EXPECTED_COUNT} example files in {_EXAMPLES_DIR}, "
        f"found {[p.name for p in _EXAMPLE_FILES]}"
    )


@pytest.mark.parametrize("path", _EXAMPLE_FILES, ids=lambda p: p.stem)
def test_example_envelope_shape(path: Path):
    example = json.loads(path.read_text(encoding="utf-8"))
    assert set(example) >= {"name", "intent", "messages"}, (
        f"{path.name}: envelope must carry name, intent, messages"
    )
    assert isinstance(example["name"], str) and example["name"], f"{path.name}: name must be non-empty"
    assert isinstance(example["intent"], str) and example["intent"], f"{path.name}: intent must be non-empty"
    assert isinstance(example["messages"], list) and example["messages"], (
        f"{path.name}: messages must be a non-empty list"
    )


@pytest.mark.parametrize("path", _EXAMPLE_FILES, ids=lambda p: p.stem)
def test_example_messages_conform_to_catalog(path: Path):
    example = json.loads(path.read_text(encoding="utf-8"))
    # The live agent's `validate_surface`, not the deterministic agent's partial probe: every
    # example is a *complete* surface, and it is the live agent these examples prompt. Its four
    # passes run schema conformance on an id-stripped copy while keeping the id-retained tree for
    # topology, so root/orphan and binding-resolvability are checked without the id-stripping
    # conflict that forced the earlier non-strict probe. An example carrying an unresolvable
    # binding or an orphaned component would otherwise teach the model exactly that defect.
    validate_surface(example["messages"])  # must not raise
