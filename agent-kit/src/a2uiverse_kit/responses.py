"""Canned-response infrastructure: fixture playing, stamping, visible fallback.

The kit owns only the machinery. Fixtures, their action maps, and any dynamic
handlers are the app's: `fixture_responder` builds the standard
(build_response, build_text_response) pair from an app's fixtures dir and action
map, `stub_fixture_loader` builds the cached loader an app's stub tools read
their corpus through, and the low-level helpers are exported for an app that
composes its own pair around them.
"""

from __future__ import annotations

import functools
import json
from collections.abc import Callable
from itertools import count
from pathlib import Path
from typing import Any

from a2uiverse_kit.config import BuildResponse, BuildTextResponse
from a2uiverse_kit.versions import WIRE_VERSION

# The operation keys whose object carries the surfaceId we stamp.
_OPERATION_KEYS = ("updateComponents", "updateDataModel", "createSurface")


def load_fixture(fixtures_dir: Path, name: str) -> list[dict]:
    path = fixtures_dir / name
    if not path.is_file():
        raise FileNotFoundError(
            f"deterministic fixture {name} is missing from {fixtures_dir}; "
            "see the agent's README for how its canned corpus is produced."
        )
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def stub_fixture_loader(fixtures_dir: Path, *, hint: str) -> Callable[[str], Any]:
    """A cached loader over an app's stub corpus (`<fixtures_dir>/<name>.json`).

    A missing fixture is a setup problem, so it fails with `hint` — the app's
    pointer at how its corpus is produced — rather than an opaque file error.
    """

    @functools.lru_cache(maxsize=16)
    def fixture(name: str) -> Any:
        path = fixtures_dir / f"{name}.json"
        if not path.is_file():
            raise FileNotFoundError(f"stub fixture {path.name} is missing. {hint}")
        return json.loads(path.read_text(encoding="utf-8"))

    return fixture


def stamp_surface(messages: list[dict], surface_id: str) -> list[dict]:
    for msg in messages:
        for key in _OPERATION_KEYS:
            if key in msg:
                msg[key]["surfaceId"] = surface_id
    return messages


def fallback(name: str, surface_id: str) -> list[dict]:
    """A visible "unhandled" response, rather than a silent no-op."""
    return [
        {
            "version": WIRE_VERSION,
            "updateComponents": {
                "surfaceId": surface_id,
                "components": [
                    {"id": "label", "component": "Text", "text": f"Unhandled event: {name}"}
                ],
            },
        }
    ]


def fixture_responder(
    fixtures_dir: Path,
    event_fixtures: dict[str, str],
    *,
    text_fixture: str,
    surface_prefix: str,
) -> tuple[BuildResponse, BuildTextResponse]:
    """The standard fixture-playing response pair over an app's canned corpus.

    Actions resolve through `event_fixtures` (falling back to the visible unhandled
    response); any plain-text prompt answers with `text_fixture` on a fresh
    `<surface_prefix>-N` surface — a surfaceId may not be re-created on the client,
    and the stateless executor cannot know what already exists, so fresh ids keep
    every turn renderable. The text path does not route: whatever it is asked, it
    answers with the canned digest the fan-out beat expects — discriminating on the
    utterance would be a second, worse router; the live modes are where intent is
    read.
    """
    surface_counter = count(1)

    def build_response(action: dict) -> list[dict]:
        name = action.get("name", "")
        surface_id = action.get("surfaceId", "")
        fixture = event_fixtures.get(name)
        if fixture is None:
            return fallback(name, surface_id)
        return stamp_surface(load_fixture(fixtures_dir, fixture), surface_id)

    def build_text_response(text: str) -> list[dict]:
        messages = load_fixture(fixtures_dir, text_fixture)
        return stamp_surface(messages, f"{surface_prefix}-{next(surface_counter)}")

    return build_response, build_text_response
