"""The brand guidance asks only for sizes the catalog allows.

A title size the catalog refuses costs the answer its first attempt and a correction retry: a
title's `"small"`, read onto the page header's title area, which takes `subtitle`, `medium` or
`large`, refused GitHub's first answer on three of four runs in a2uiverse task 17.11's acceptance.
So each title component's size rule names that component, and only it, and only its own sizes.
"""

from __future__ import annotations

import json
import re

import pytest

from app.config import CONFIG

_GUIDANCE = CONFIG.brand_guidance_path.read_text(encoding="utf-8")
_COMPONENTS = json.loads(CONFIG.catalog_path.read_text(encoding="utf-8"))["components"]

# The two components a surface's title is sized on.
_TITLES = ("Heading", "PageHeader.TitleArea")


def _bullets(text: str) -> list[str]:
    """Each top-level bullet with its continuation lines joined."""
    bullets: list[str] = []
    for line in text.splitlines():
        if line.startswith("- "):
            bullets.append(line[2:])
        elif bullets and line.startswith("  ") and line.strip():
            bullets[-1] += " " + line.strip()
        elif not line.strip() and bullets:
            bullets.append("")  # a blank line ends the bullet
    return [b for b in bullets if b]


def _sizes(component: str) -> set[str]:
    """The `variant` words the catalog allows the component, per viewport or not."""
    variant = _COMPONENTS[component]["properties"]["variant"]
    found: set[str] = set()

    def walk(node):
        if isinstance(node, dict):
            found.update(node.get("enum", ()))
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for value in node:
                walk(value)

    walk(variant)
    return found


def _size_rule(component: str) -> str:
    # The bullet that sets the component's size names it and its `variant`.
    rules = [b for b in _bullets(_GUIDANCE) if f"`{component}`" in b and "`variant`" in b]
    assert len(rules) == 1, f"one bullet sizes `{component}`, found {len(rules)}"
    return rules[0]


@pytest.mark.parametrize("component", _TITLES)
def test_a_title_size_rule_names_its_component_alone(component):
    rule = _size_rule(component)
    others = [t for t in _TITLES if t != component and f"`{t}`" in rule]
    assert not others, f"the rule sizing `{component}` also names {others}"


@pytest.mark.parametrize("component", _TITLES)
def test_a_title_size_rule_asks_only_for_sizes_its_component_allows(component):
    asked = set(re.findall(r'`"([a-z]+)"`', _size_rule(component)))
    assert asked, f"the rule sizing `{component}` names no size"
    assert asked <= _sizes(component), (
        f"`{component}` allows {sorted(_sizes(component))}; the guidance asks for "
        f"{sorted(asked - _sizes(component))}"
    )
