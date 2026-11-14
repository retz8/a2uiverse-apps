"""Deterministic AgentExecutor: returns canned A2UI for the incoming action or text prompt.

The response content comes from the app: the executor is constructed with the config's
(build_response, build_text_response) pair and owns only the A2A mechanics around them. A
canned `paintMeta` rides as the shell part the live executor emits, ahead of every A2UI part,
so the paint it names is titled and a question is marked (task-10.9 decision 8).

Given the app's catalog lines, each turn is answered by the pair of the line it is painted in
(a2uiverse task-15.7). Each request is answered in the version chosen for it, stamped on every
A2UI part whatever the fixture says (a2uiverse task-19.4).
"""

from __future__ import annotations

from collections.abc import Sequence

from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.server.tasks import TaskUpdater
from a2a.types import AgentCard, Part

from a2ui_agent_kit.catalog_lines import CatalogLines, SurfaceCatalogs, advertised_catalog_ids
from a2ui_agent_kit.config import BuildResponse, BuildTextResponse
from a2ui_agent_kit.paint_meta import create_paint_meta_part
from a2ui_agent_kit.sign_in import (
    AuthRequired,
    SignIn,
    auth_required_message,
    bind_account,
    require_action_scopes,
    unbind_account,
)
from a2ui_agent_kit.versions import A2UI_VERSIONS, choose_version, extract_action, stamped_part
from a2ui_agent_kit.wire import first_text, open_task, text_part


class DeterministicAgentExecutor(AgentExecutor):
    """Returns a canned, catalog-conformant A2UI response on every action or text prompt."""

    def __init__(
        self,
        build_response: BuildResponse,
        build_text_response: BuildTextResponse,
        sign_in: SignIn | None = None,
        lines: CatalogLines | None = None,
        *,
        card: AgentCard | None = None,
        versions: Sequence[str] = A2UI_VERSIONS,
    ):
        self._build_response = build_response
        self._build_text_response = build_text_response
        self._sign_in = sign_in
        # Given, each turn takes the pair of the line the kit chooses for it, and the pair
        # above goes unused; absent, every turn is the pair's, in whatever id it paints.
        self._lines = lines
        self._surfaces = SurfaceCatalogs()
        # The card the app serves and the versions it speaks, which each request's version is
        # chosen from; without the card, every request takes the app's newest.
        self._card = card
        self._versions = tuple(versions)

    async def execute(self, context: RequestContext, event_queue: EventQueue) -> None:
        # The request's signed-in account, readable by the app's answer code through
        # `current_account()` for this run.
        bound = bind_account(context, self._sign_in)
        try:
            await self._execute(context, event_queue)
        finally:
            unbind_account(bound)

    async def _execute(self, context: RequestContext, event_queue: EventQueue) -> None:
        version = choose_version(context, self._card, self._versions)
        action = extract_action(context.message, version)
        text = first_text(context.message) if action is None else None
        build_response, build_text_response = self._build_response, self._build_text_response
        context_id = context.context_id
        if self._lines is not None:
            pressed = (
                self._surfaces.catalog_of(context_id, action.get("surfaceId"))
                if action is not None
                else None
            )
            turn = self._lines.choose(advertised_catalog_ids(context.message, version), pressed)
            if turn is None:
                await self._say(context, event_queue, self._lines.not_shown_text)
                return
            build_response = turn.line.build_response
            build_text_response = turn.line.build_text_response
        try:
            if text is not None:
                messages = build_text_response(text)
            else:
                # An action needing a scope the token lacks ends the run asking for it.
                require_action_scopes((action or {}).get("name"))
                # No parseable A2UI action or text -> unknown-event fallback.
                messages = build_response(action or {"name": "", "surfaceId": ""})
        except AuthRequired as err:
            await self._auth_required(context, event_queue, err)
            return
        self._surfaces.record(context_id, messages)
        parts: list[Part] = [
            *(create_paint_meta_part(msg["paintMeta"]) for msg in messages if "paintMeta" in msg),
            *(stamped_part(msg, version) for msg in messages if "paintMeta" not in msg),
        ]
        updater = await open_task(context, event_queue)
        await updater.complete(updater.new_agent_message(parts))

    async def _say(self, context: RequestContext, event_queue: EventQueue, text: str) -> None:
        """A turn answered in words alone, nothing painted."""
        updater = await open_task(context, event_queue)
        await updater.complete(updater.new_agent_message([text_part(text)]))

    async def _auth_required(
        self, context: RequestContext, event_queue: EventQueue, err: AuthRequired
    ) -> None:
        updater = await open_task(context, event_queue)
        await updater.requires_auth(auth_required_message(err, context.context_id, context.task_id))

    async def cancel(self, context: RequestContext, event_queue: EventQueue) -> None:
        # Nothing of its own to stop: a turn is one completed final, and the SDK answers
        # a task that already ended not cancelable without calling here. A cancel that
        # lands before that final is answered with a bare `canceled` (task-8.9 decision 3).
        await TaskUpdater(event_queue, context.task_id, context.context_id).cancel()
