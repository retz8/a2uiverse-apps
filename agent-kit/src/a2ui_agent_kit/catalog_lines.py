"""An app's catalog lines — its current catalog id, and one old id beside it — and the line
each turn is painted in (a2uiverse task-15.7).

A2UI's catalog negotiation is the whole mechanism: the card lists the ids the agent paints
in, the client lists the ids it renders on every message, and each surface's id is chosen at
its creation, locked for its life. A breaking catalog change is a new id; an agent holding
both prefers the new one where the client renders it, and a client still on the old one
keeps matching the old (upstream `docs/public/concepts/catalogs.md`, "Handling Migrations").
"""

from __future__ import annotations

import contextvars
import functools
from typing import NamedTuple

from a2ui.schema.constants import A2UI_CLIENT_CAPABILITIES_KEY, SUPPORTED_CATALOG_IDS_KEY

from a2ui_agent_kit.catalog import CatalogContext, catalog_context
from a2ui_agent_kit.config import AgentAppConfig, CatalogLine

# A client keys its capabilities by the protocol version — the hub under `v0.9`, as the pinned
# schemas have it, others under `v0.9.1` — or writes them flat, as upstream's guide shows
# (a2uiverse SPEC §14).
_CAPABILITIES_VERSION_KEYS = ("v0.9", "v0.9.1")


class Turn(NamedTuple):
    """The line a turn is painted in, and whether it must paint a fresh surface."""

    line: CatalogLine
    catalog_id: str
    context: CatalogContext
    fresh_surface: bool


class CatalogLines:
    """An app's lines, newest first, and the choice of one per turn."""

    def __init__(self, config: AgentAppConfig):
        self.current = CatalogLine(
            catalog_path=config.catalog_path,
            catalog_kind=config.catalog_kind,
            examples_dir=config.examples_dir,
            brand_guidance_path=config.brand_guidance_path,
            question_policy=config.question_policy,
            build_response=config.build_response,
            build_text_response=config.build_text_response,
        )
        self.old = config.old_catalog_line
        # The current line validates through the config's own context, the one every
        # caller of `catalog_context(config)` already shares.
        self._contexts = {id(self.current): catalog_context(config)}
        if self.old is not None:
            self._contexts[id(self.old)] = catalog_context(self.old)
        self._by_id = {self.catalog_id(line): line for line in self.lines()}
        if self.old is not None and len(self._by_id) == 1:
            raise ValueError(
                f"the old catalog line names {self.catalog_id(self.old)}, the current line's "
                "own id: a breaking catalog change is a new catalog id"
            )
        # A client that renders neither id gets no UI, as upstream's negotiation has it.
        self.not_shown_text = f"{config.name} has changed and can't show this here."

    def lines(self) -> list[CatalogLine]:
        return [self.current] if self.old is None else [self.current, self.old]

    def ids(self) -> list[str]:
        """The ids the card names, newest first."""
        return [self.catalog_id(line) for line in self.lines()]

    def catalog_id(self, line: CatalogLine) -> str:
        return self.context(line).get_catalog().catalog_id

    def context(self, line: CatalogLine) -> CatalogContext:
        return self._contexts[id(line)]

    def choose(
        self, advertised: list[str] | None, pressed_catalog_id: str | None = None
    ) -> Turn | None:
        """The line a turn is painted in; None when the client renders neither id.

        `pressed_catalog_id` is the id of the surface an action came from, when the kit
        knows it: the turn is written whole in it, while a line holds it and the client
        renders it; otherwise the newest advertised line answers it as a fresh surface. A
        text request, or an action on a surface the kit does not know, takes the newest
        advertised line, a change in place allowed.
        """
        if pressed_catalog_id is not None:
            line = self._by_id.get(pressed_catalog_id)
            if line is not None and (advertised is None or pressed_catalog_id in advertised):
                return self._turn(line, fresh_surface=False)
            newest = self._newest(advertised)
            return None if newest is None else self._turn(newest, fresh_surface=True)
        newest = self._newest(advertised)
        return None if newest is None else self._turn(newest, fresh_surface=False)

    def _newest(self, advertised: list[str] | None) -> CatalogLine | None:
        if advertised is None:  # no capabilities: the newest, as a single-line app paints
            return self.current
        return next((line for line in self.lines() if self.catalog_id(line) in advertised), None)

    def _turn(self, line: CatalogLine, fresh_surface: bool) -> Turn:
        return Turn(line, self.catalog_id(line), self.context(line), fresh_surface)


@functools.lru_cache(maxsize=None)
def catalog_lines(config: AgentAppConfig) -> CatalogLines:
    """The shared per-config lines; raises when the old line is the current line's id."""
    return CatalogLines(config)


def advertised_catalog_ids(message) -> list[str] | None:
    """The catalog ids the client renders, from its `a2uiClientCapabilities`; None when it
    sent none."""
    metadata = getattr(message, "metadata", None) if message else None
    capabilities = (
        metadata.get(A2UI_CLIENT_CAPABILITIES_KEY) if isinstance(metadata, dict) else None
    )
    if not isinstance(capabilities, dict):
        return None
    if SUPPORTED_CATALOG_IDS_KEY not in capabilities:
        capabilities = next(
            (
                capabilities[key]
                for key in _CAPABILITIES_VERSION_KEYS
                if isinstance(capabilities.get(key), dict)
            ),
            {},
        )
    ids = capabilities.get(SUPPORTED_CATALOG_IDS_KEY)
    if not isinstance(ids, list):
        return None
    return [catalog_id for catalog_id in ids if isinstance(catalog_id, str)]


# The line the running turn is painted in, read by the model's instruction: one agent, one
# conversation, the prompt of the turn's own line.
_turn_line: contextvars.ContextVar[CatalogLine | None] = contextvars.ContextVar(
    "a2ui_agent_kit_turn_line", default=None
)


def bind_turn_line(line: CatalogLine) -> contextvars.Token:
    return _turn_line.set(line)


def unbind_turn_line(token: contextvars.Token) -> None:
    _turn_line.reset(token)


def turn_line() -> CatalogLine | None:
    return _turn_line.get()


class SurfaceCatalogs:
    """The catalog id of each surface the kit created, per conversation.

    An action names only its surface; the kit knows the surface's id from the
    `createSurface` it sent. Held in memory, as the model's conversation is: a surface
    painted before the agent last started is unknown.
    """

    def __init__(self):
        self._by_context: dict[str, dict[str, str]] = {}

    def record(self, context_id: str, messages: list[dict]) -> None:
        for message in messages:
            create = message.get("createSurface") if isinstance(message, dict) else None
            if isinstance(create, dict):
                surface_id, catalog_id = create.get("surfaceId"), create.get("catalogId")
                if isinstance(surface_id, str) and isinstance(catalog_id, str):
                    self._by_context.setdefault(context_id, {})[surface_id] = catalog_id

    def catalog_of(self, context_id: str, surface_id: object) -> str | None:
        if not isinstance(surface_id, str):
            return None
        return self._by_context.get(context_id, {}).get(surface_id)


def paint_in(messages: list[dict], catalog_id: str) -> list[dict]:
    """The messages with every `createSurface` naming `catalog_id`, the turn's own."""
    painted = []
    for message in messages:
        create = message.get("createSurface") if isinstance(message, dict) else None
        if isinstance(create, dict) and create.get("catalogId") != catalog_id:
            message = {**message, "createSurface": {**create, "catalogId": catalog_id}}
        painted.append(message)
    return painted
