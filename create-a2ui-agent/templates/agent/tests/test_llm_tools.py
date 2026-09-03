"""The stub toolset: canned, real-shaped, and never a mutation."""

from __future__ import annotations

from app.tools import STUB_TOOLS, get_greeting


def test_every_stub_tool_is_registered():
    assert get_greeting in STUB_TOOLS


def test_the_greeting_carries_bindable_fields():
    payload = get_greeting()
    assert isinstance(payload["greeting"], str) and payload["greeting"]
    assert isinstance(payload["facts"], list) and payload["facts"]


def test_a_name_is_folded_into_the_greeting():
    assert get_greeting("Ada")["greeting"].endswith(", Ada")
