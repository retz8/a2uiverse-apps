"""Live AgentExecutor: stream parsed A2UI to the client, validate at end, retry on failure.

Catalog validation, the question policy, and the debug-dump anchor all come from the
app's config; the streaming/retry machinery is vendor-free.
"""

from __future__ import annotations

import contextlib
import json
import logging
import os
from datetime import datetime, timezone

from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.server.tasks import TaskUpdater
from a2a.types import DataPart, Part, Task, TaskState, TextPart, UnsupportedOperationError
from a2a.utils import new_agent_parts_message, new_task
from a2a.utils.errors import ServerError
from a2ui.a2a.parts import create_a2ui_part
from a2ui.parser.parser import parse_response
from a2ui.parser.streaming_v09 import A2uiStreamParserV09
from a2ui.schema.constants import VERSION_0_9

from a2uiverse_kit.catalog import catalog_context
from a2uiverse_kit.config import AgentAppConfig
from a2uiverse_kit.paint_meta import PaintTitleTagFilter, create_paint_meta_part
from a2uiverse_kit.recorder import RECORD_DIR_ENV, create_recorder
from a2uiverse_kit.responder import LlmResponder, ModelTurnError
from a2uiverse_kit.versions import WIRE_VERSION

logger = logging.getLogger(__name__)


class _StrKeyedComponents(dict):
    """Component cache that drops any component whose id is not a string.

    The SDK indexes seen components by `comp["id"]` with no type guard (two sites:
    A2uiStreamParserV09._handle_complete_object and the base parser's
    _handle_partial_component). A model that emits an object for `id` therefore
    reaches a dict subscript and raises TypeError — `cannot use 'dict' as a dict
    key` — aborting the attempt mid-stream. Guarding the cache itself covers both
    sites at once, rather than re-implementing two large SDK methods.

    Dropping the component is safe: it simply does not stream incrementally. A
    genuinely malformed surface is still rejected at end-of-stream by
    validate_surface, which is where the id's type gets a real verdict.
    """

    def __setitem__(self, key, value) -> None:
        if not isinstance(key, str):
            logger.debug("skipped a component whose id is not a string: %r", key)
            return
        super().__setitem__(key, value)


class LenientA2uiStreamParser(A2uiStreamParserV09):
    """A2uiStreamParserV09 whose incremental yield tolerates transient cycles.

    The SDK's incremental yield re-raises Self-reference/Circular topology errors on
    the assumption that more data cannot resolve them — false under partial-JSON
    healing: a chunk boundary that splits a child id right after a parent-id prefix
    (e.g. "row-0-lv" cut at "row-0") heals into a momentary self-loop that the next
    chunk resolves. Skip that yield instead of failing the attempt; genuine cycles
    are still rejected at end-of-stream by validate_surface's topology pass.

    It also guards the component cache against non-string ids (see
    _StrKeyedComponents) and tolerates the TypeError a non-string *reference* id
    provokes inside topology analysis — get_component_references yields
    `componentId` values without checking they are strings, so a malformed
    reference reaches a set/dict operation the same way an id does.
    """

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._seen_components = _StrKeyedComponents(self._seen_components)

    def yield_reachable(self, messages, check_root=False, raise_on_orphans=False):
        try:
            super().yield_reachable(
                messages, check_root=check_root, raise_on_orphans=raise_on_orphans
            )
        except TypeError as err:
            # A non-string reference id inside the topology walk. Same disposition as
            # a transient cycle: skip the incremental yield, let validate_surface rule
            # on the finished payload.
            if check_root or raise_on_orphans:
                raise
            logger.debug("incremental yield skipped a non-string reference: %s", err)
            return
        except ValueError as err:
            if check_root or raise_on_orphans:
                raise
            message = str(err)
            if "Self-reference" in message or "Circular" in message:
                logger.debug("incremental yield skipped a transient cycle: %s", message)
                return
            raise

# A2A message-metadata key under which the client reports the current data model of
# its sendDataModel-flagged surfaces (the spec's A2A binding; no upstream constant).
CLIENT_DATA_MODEL_KEY = "a2uiClientDataModel"
# A2A message-metadata key under which the canvas attaches fork context when a turn is
# dispatched from a parked (historical) view — task-8.5 decision 9/10. Presence of the
# key IS the historical-view flag; the object carries {paintId, title, paintedAt,
# position}, with position the depth behind the live head at dispatch.
FORK_CONTEXT_KEY = "a2uiForkContext"
MAX_ATTEMPTS = 2  # one initial + one retry; tunable (spec decision 6)
APOLOGY_TEXT = (
    "Sorry — I couldn't compose a valid interface for that request. Please try rephrasing."
)
UNAVAILABLE_TEXT = (
    "Sorry — the language model is temporarily unavailable. Please try again in a moment."
)
# Retry correction for a Gemini turn aborted with finish_reason=MALFORMED_FUNCTION_CALL
# (the model emitted tool-call syntax the API could not parse; zero output). An
# unchanged retry fails identically — this names the actual failure and the way out.
MALFORMED_CALL_CORRECTION = (
    "Your previous turn ended in a malformed function call and produced no output. "
    "Call exactly one tool per turn, passing arguments as plain JSON values; once "
    "the tool results are in, compose the A2UI surface."
)


def _extract_text(context: RequestContext) -> str:
    message = context.message
    if message and message.parts:
        for part in message.parts:
            root = part.root
            if isinstance(root, TextPart) and root.text:
                return root.text
    return ""


def _extract_action(context: RequestContext) -> dict | None:
    """Returns the A2UI action carried by a v0.9 DataPart, or None.

    The chat client ships a component action as one DataPart shaped
    `{version: "v0.9", action: {name, surfaceId, sourceComponentId, context, ...}}`
    (client/src/a2a/messages.ts -> buildActionMessageParams). The action's `context`
    is already resolved to concrete values on the client before it is sent.
    """
    message = context.message
    if not message or not message.parts:
        return None
    for part in message.parts:
        root = part.root
        if isinstance(root, DataPart) and root.data.get("version") == WIRE_VERSION:
            action = root.data.get("action")
            if isinstance(action, dict):
                return action
    return None


def _frame_action_prompt(action: dict) -> str:
    """Frames a resolved A2UI action as a model turn asking for the next surface.

    An action arrives with no natural-language prompt, so the model is handed the
    action name plus its resolved context values and told to compose the resulting
    view — feeding the same stream/validate/retry loop the text path uses.
    """
    name = action.get("name") or "(unnamed)"
    context_values = action.get("context") or {}
    lines = [
        f'The user activated the "{name}" action on the current surface. '
        "Compose the next surface in response to this action.",
    ]
    if context_values:
        lines.append("The action carried these resolved context values:")
        for key, value in context_values.items():
            lines.append(f"- {key}: {value!r}")
    else:
        lines.append("The action carried no additional context.")
    return "\n".join(lines)


def _extract_client_data_model(context: RequestContext) -> dict | None:
    """Returns the client-reported surfaces map ({surfaceId: dataModel}), or None.

    Surfaces created with sendDataModel: true make the client attach its current data
    model — including local edits the agent never saw, like checkbox selections — to
    every message it sends, as metadata["a2uiClientDataModel"] = {version, surfaces}.
    """
    message = context.message
    metadata = getattr(message, "metadata", None) if message else None
    if not isinstance(metadata, dict):
        return None
    payload = metadata.get(CLIENT_DATA_MODEL_KEY)
    surfaces = payload.get("surfaces") if isinstance(payload, dict) else None
    if isinstance(surfaces, dict) and surfaces:
        return surfaces
    return None


def _frame_client_data_model(surfaces: dict) -> str:
    return (
        "\n\nCurrent data model of the surface(s) the user is looking at, as "
        "reported by the client (reflects the user's local edits, e.g. "
        "selections):\n" + json.dumps(surfaces)
    )


def _extract_fork_context(context: RequestContext) -> dict | None:
    """Returns the canvas's fork context ({paintId, title, paintedAt, position}), or
    None. Its presence means the turn was dispatched from a parked historical view."""
    message = context.message
    metadata = getattr(message, "metadata", None) if message else None
    if not isinstance(metadata, dict):
        return None
    fork = metadata.get(FORK_CONTEXT_KEY)
    return fork if isinstance(fork, dict) else None


def _frame_fork_context(fork: dict) -> str:
    """Frames a forked turn: the historical-view facts plus explicit directives
    (task-8.5 decision 11) — the fork is the one case where the conversation history
    actively misleads the model, so the staleness rules are stated, not implied."""
    title = fork.get("title")
    identity = f"the past view titled {title!r}" if isinstance(title, str) and title else (
        "a past view"
    )
    painted_at = fork.get("paintedAt")
    if isinstance(painted_at, (int, float)) and not isinstance(painted_at, bool):
        when = datetime.fromtimestamp(painted_at / 1000, tz=timezone.utc)
        identity += f", painted at {when.strftime('%Y-%m-%d %H:%M UTC')}"
    position = fork.get("position")
    if isinstance(position, int) and not isinstance(position, bool) and position > 0:
        plural = "s" if position != 1 else ""
        identity += f", now {position} paint{plural} behind the current view"
    return (
        f"\n\nThis message was sent from a HISTORICAL view the user navigated back to "
        f"— {identity}. The data model attached to this message reflects that "
        "historical view as the user last touched it: its data is as of that time, "
        "not now. Refetch live data through your tools before composing anything that "
        "depends on current state. Your response will be painted as the NEWEST view — "
        "it does not overwrite or edit the historical one — and do not be confused if "
        "the referenced content has changed since that view was painted."
    )


def _resolve_prompt(context: RequestContext) -> str:
    """Resolves the incoming message to a model prompt: text first, then an action.

    Returns "" when the message carries neither usable text nor an A2UI action; the
    executor turns that into a plain-text apology rather than calling the model with
    an empty prompt (which the provider rejects). A client-reported data model riding
    the message metadata is framed onto the prompt, so the model sees the UI state
    the user is acting on.
    """
    prompt = _extract_text(context)
    if not prompt:
        action = _extract_action(context)
        if action is not None:
            prompt = _frame_action_prompt(action)
    if not prompt:
        return ""
    fork = _extract_fork_context(context)
    if fork:
        # Framed before the data model so the staleness rules precede the data they
        # apply to.
        prompt += _frame_fork_context(fork)
    surfaces = _extract_client_data_model(context)
    if surfaces:
        prompt += _frame_client_data_model(surfaces)
    return prompt


def _collect_payload(accumulated: str) -> list[dict]:
    """Extracts the full A2UI message list from the accumulated model text.

    Returns an empty list when the response carries no A2UI block (parse_response
    raises in that case); the executor treats an empty payload as a failed attempt.
    """
    try:
        parts = parse_response(accumulated)
    except ValueError:
        return []
    payload: list[dict] = []
    for part in parts:
        if part.a2ui_json:
            data = part.a2ui_json
            payload.extend(data if isinstance(data, list) else [data])
    return payload


class LlmAgentExecutor(AgentExecutor):
    """Streams parsed A2UI parts, validates the complete surface, retries on failure.

    Stream-first / validate-at-end / retry-and-restream (spec decision 6): each parsed
    part is emitted to the client as it arrives while the raw response accumulates; the
    complete payload is validated at the end; on failure the model is re-run with the
    validation error (up to `max_attempts` total); exhaustion yields a plain-text apology.
    """

    def __init__(
        self,
        responder: LlmResponder,
        config: AgentAppConfig,
        max_attempts: int = MAX_ATTEMPTS,
        recorder=None,
    ):
        self._responder = responder
        self._max_attempts = max_attempts
        self._catalog = catalog_context(config)
        self._question_policy = config.question_policy
        # Off unless A2UI_RECORD_DIR is set; see recorder.py. Injectable so tests arm
        # it without touching the environment.
        self._recorder = recorder or create_recorder(os.environ.get(RECORD_DIR_ENV))
        # Debug dumps, anchored to the app dir (gitignored there). failed_stream: the
        # model text a failed attempt died on — without it the response is discarded
        # with the attempt. surface: the latest SUCCESSFUL turn's payload — a valid
        # surface is discarded once streamed, and rendered pixels cannot say whether a
        # row carries an action or what a binding resolves to.
        self._failed_stream_dump = config.app_dir / "failed_stream.dump.txt"
        self._surface_dump = config.app_dir / "surface.dump.json"

    def _reset_failed_stream_dump(self) -> None:
        """Clears the dump at the start of a request, so it only ever holds the latest one."""
        with contextlib.suppress(OSError):
            self._failed_stream_dump.unlink(missing_ok=True)

    def _dump_surface(self, payload: list[dict]) -> None:
        """Writes the surface a successful turn produced, for inspection between rounds.

        Best-effort: a dump that cannot be written must never fail an otherwise good turn.
        """
        with contextlib.suppress(OSError, TypeError, ValueError):
            self._surface_dump.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def _dump_failed_stream(self, accumulated: str, attempt: int, err: Exception) -> None:
        """Appends the model text a failed attempt produced, for post-hoc diagnosis.

        Appends rather than overwrites so a request whose attempts all fail keeps every
        attempt's response side by side — the sequence is what shows whether the model is
        repeating one mistake or drifting between several.

        Best-effort: a dump that cannot be written must never take down the attempt's
        error handling, which is already running on a failure path.
        """
        try:
            with self._failed_stream_dump.open("a", encoding="utf-8") as fh:
                fh.write(
                    f"=== attempt {attempt} failed with {type(err).__name__}: {err}\n"
                    f"--- raw model response ({len(accumulated)} chars) ---\n"
                    f"{accumulated}\n\n"
                )
        except OSError:  # read-only fs, missing dir — diagnosis is not worth a crash
            logger.debug("could not write %s", self._failed_stream_dump, exc_info=True)

    async def execute(self, context: RequestContext, event_queue: EventQueue) -> None:
        prompt = _resolve_prompt(context)
        action = _extract_action(context)
        # An action message carries no text; that is what distinguishes the two drivers
        # of a paint on the wire, and the fixture records which one it was.
        kind = "surface-action" if action is not None and not _extract_text(context) else "utterance"

        task = context.current_task
        if not task:
            task = new_task(context.message)
            await event_queue.enqueue_event(task)
        updater = TaskUpdater(event_queue, task.id, task.context_id)

        if not prompt:
            # Neither usable text nor an A2UI action: apologize in plain text instead
            # of calling the model with an empty prompt (which the provider rejects).
            logger.info(
                "execute: empty message (no text or action) for task=%s; apologizing",
                task.id,
            )
            await updater.update_status(
                TaskState.completed,
                new_agent_parts_message(
                    [Part(root=TextPart(text=APOLOGY_TEXT))], task.context_id, task.id
                ),
                final=True,
            )
            return

        logger.info(
            "execute start: task=%s context=%s prompt=%r", task.id, task.context_id, prompt
        )
        self._reset_failed_stream_dump()
        self._recorder.start_turn(
            context_id=task.context_id,
            task_id=task.id,
            kind=kind,
            prompt=prompt,
            action=action,
        )

        # One parser persisted across attempts. Its dedup caches make a retry patch the
        # surface attempt 1 created — createSurface and unchanged components are
        # suppressed, only changed/new components stream as updateComponents — instead of
        # a deleteSurface + full re-stream, which reads as a wipe-and-redraw under token
        # streaming. (Supersedes spec decision 6's teardown-and-restream.)
        # Catalog-less v0.9 parser: incremental structural heal + yield only; validation
        # is at-end (validate_surface), so the parser must not reject the id-bearing wire
        # format the catalog does not model.
        parser = LenientA2uiStreamParser(catalog=None)
        # Catalog-less construction leaves the parser's version unset, which arms its
        # v0.8 compatibility shim: every relative binding path in streamed parts gets
        # rewritten absolute ('title' -> '/title'), silently breaking template item
        # bindings on the client. Pin the version to disarm it.
        parser._version = VERSION_0_9
        # It also leaves the ref-field map empty, so the parser's reachability yield
        # cannot traverse the catalog's custom component-reference props (e.g.
        # PageLayout's header/content/pane) and silently drops every component behind
        # them. Hand it the map without the catalog itself.
        parser._ref_fields_map = self._catalog.live_ref_fields()

        correction: str | None = None
        model_unavailable = False
        created_surfaces: set[str] = set()
        # Request-level paint metas (surfaceId -> meta), fed by the per-attempt tag
        # filter: a retry's re-declared tag overwrites, so the marker validation always
        # judges the latest declaration.
        paint_metas: dict[str, dict] = {}
        for attempt in range(1, self._max_attempts + 1):
            # Flush the partial-parse tail a prior failed attempt left in the parser (a
            # mid-block ValueError aborts before the parser's own reset), keeping the
            # dedup caches that drive in-place patching. A no-op on the first attempt.
            parser._reset_json_state()
            parser._found_delimiter = False
            parser._buffer = ""
            # Fresh per attempt: a partial tag a failed attempt left buffered must not
            # bleed into the next attempt's prose.
            tag_filter = PaintTitleTagFilter()
            accumulated = ""
            stream_error: Exception | None = None
            logger.info("attempt %d: calling model", attempt)
            first_token = True
            stream = self._responder.stream(
                prompt, correction, context_id=task.context_id
            )
            try:
                async for token in stream:
                    if first_token:
                        logger.info("attempt %d: first model token received", attempt)
                        first_token = False
                    accumulated += token
                    # A malformed A2UI block raises here mid-stream; that is the same
                    # failure class as an invalid surface, so it feeds the same
                    # correction/retry loop instead of escaping as a server error.
                    try:
                        response_parts = parser.process_chunk(token)
                    except (ValueError, TypeError) as err:
                        # TypeError joins ValueError here because a malformed value
                        # where the SDK expects a string (an object component id, an
                        # object componentId reference) surfaces as TypeError, not
                        # ValueError. It is the same failure class — a bad block the
                        # model can be told to correct — so it must feed the same
                        # correction/retry loop instead of falling through to the
                        # generic handler, which would retry with an unchanged prompt
                        # and then blame the provider for an outage that never happened.
                        stream_error = err
                        break
                    for response_part in response_parts:
                        created_surfaces |= self._surface_ids(response_part)
                        parts = self._parts_for(response_part, tag_filter, paint_metas)
                        if parts:
                            self._recorder.record_batch(parts)
                            await updater.update_status(
                                TaskState.working,
                                new_agent_parts_message(parts, task.context_id, task.id),
                            )
            except ModelTurnError as err:  # the turn errored out with zero output
                logger.warning("attempt %d model turn failed: %s", attempt, err)
                if "MALFORMED_FUNCTION_CALL" in err.error_code:
                    # A model mistake, not an outage: retry with a correction that
                    # names it — an unchanged retry fails identically, and the
                    # generic "failed validation" correction describes a response
                    # that never existed.
                    model_unavailable = False
                    correction = MALFORMED_CALL_CORRECTION
                else:
                    model_unavailable = True
                continue
            except Exception as err:  # model/infra failure (quota, 5xx, network)
                # Must not abort the SSE stream raw — the client would see a bare
                # network error. Retry with the prompt unchanged; a transient
                # provider error is not a correction-worthy model mistake.
                #
                # exc_info because anything reaching here is by definition unclassified:
                # the message alone cannot say which frame raised, and the attempt is
                # about to discard the evidence.
                logger.warning(
                    "attempt %d model stream failed: %s", attempt, err, exc_info=True
                )
                self._dump_failed_stream(accumulated, attempt, err)
                model_unavailable = True
                # No teardown between attempts: the retry patches the partial in place.
                continue
            finally:
                # Close the stream in-task: a mid-stream parser error breaks out with
                # the generator suspended, and left to GC finalization the ADK run
                # unwinds in a foreign context (late cancellation, otel detach noise).
                # A no-op when the stream was consumed to the end.
                with contextlib.suppress(Exception):
                    await stream.aclose()
            model_unavailable = False

            # Release prose the tag filter held back (a '<' that never became a tag);
            # skipped on a parser error — that attempt's tail is about to be retried.
            held = tag_filter.flush()
            if stream_error is None and held.strip():
                held_parts = [Part(root=TextPart(text=held))]
                self._recorder.record_batch(held_parts)
                await updater.update_status(
                    TaskState.working,
                    new_agent_parts_message(held_parts, task.context_id, task.id),
                )

            payload = _collect_payload(accumulated)
            if not payload and stream_error is None and tag_filter.no_surface:
                # A declared prose-only turn (<no-surface/>): the explanation has
                # already streamed as prose, and nothing is painted — the client
                # holds its current view. Only the declaration makes this valid; an
                # undeclared surfaceless response still fails below and retries. A
                # response carrying both the marker and a surface takes the normal
                # surface path (the marker is simply stripped from the prose).
                logger.info(
                    "attempt %d: declared no-surface turn, task %s completed",
                    attempt,
                    task.id,
                )
                self._recorder.end_turn("completed")
                await updater.update_status(TaskState.completed, final=True)
                return
            try:
                if stream_error is not None:
                    raise stream_error
                if not payload:
                    raise ValueError("no A2UI surface found in the model response")
                self._catalog.validate_surface(payload)
                self._question_policy(payload, paint_metas)
            except (ValueError, TypeError) as err:
                logger.warning(
                    "attempt %d produced an invalid surface: %s", attempt, err
                )
                # The verdict alone cannot explain a failure that repeats: only the
                # response itself shows what the model actually emitted, and it is
                # about to be discarded with the attempt.
                logger.warning(
                    "attempt %d raw model response (%d chars):\n%s",
                    attempt,
                    len(accumulated),
                    accumulated,
                )
                self._dump_failed_stream(accumulated, attempt, err)
                correction = (
                    "Your previous A2UI response failed validation with this error:\n"
                    f"{err}\nReturn a corrected, complete A2UI surface."
                )
                # No teardown between attempts: the retry patches the partial in place.
                continue

            self._dump_surface(payload)
            logger.info("attempt %d: surface valid, task %s completed", attempt, task.id)
            self._recorder.end_turn("completed")
            await updater.update_status(TaskState.completed, final=True)
            return

        # Attempts exhausted -> clean up the half-baked surface (so the client is not
        # left with broken partial UI), then apologize, matched to the last failure kind.
        await self._teardown(updater, task, created_surfaces)
        apology = UNAVAILABLE_TEXT if model_unavailable else APOLOGY_TEXT
        apology_parts = [Part(root=TextPart(text=apology))]
        self._recorder.record_batch(apology_parts)
        self._recorder.end_turn("unavailable" if model_unavailable else "apology")
        await updater.update_status(
            TaskState.completed,
            new_agent_parts_message(apology_parts, task.context_id, task.id),
            final=True,
        )

    @staticmethod
    def _surface_ids(response_part) -> set[str]:
        """Surface ids created by this part's createSurface messages."""
        data = response_part.a2ui_json
        if not data:
            return set()
        ids = set()
        for msg in data if isinstance(data, list) else [data]:
            surface_id = (msg.get("createSurface") or {}).get("surfaceId")
            if surface_id:
                ids.add(surface_id)
        return ids

    async def _teardown(self, updater: TaskUpdater, task, surface_ids: set[str]) -> None:
        """Deletes surfaces a failed attempt created, so the client is not left with
        a half-streamed zombie surface (and a retry can re-create the same id)."""
        if not surface_ids:
            return
        parts = [
            create_a2ui_part(
                {"version": WIRE_VERSION, "deleteSurface": {"surfaceId": sid}},
                version=WIRE_VERSION,
            )
            for sid in sorted(surface_ids)
        ]
        self._recorder.record_batch(parts)
        await updater.update_status(
            TaskState.working,
            new_agent_parts_message(parts, task.context_id, task.id),
        )

    @staticmethod
    def _parts_for(
        response_part,
        tag_filter: PaintTitleTagFilter | None = None,
        paint_metas: dict[str, dict] | None = None,
    ) -> list[Part]:
        parts: list[Part] = []
        if response_part.text:
            text = response_part.text
            if tag_filter is not None:
                # Strip <paint-title> tags out of the prose; each completed tag becomes
                # a paintMeta shell part, emitted ahead of the createSurface it names
                # (the tag precedes the surface's <a2ui-json> block in the stream).
                text, metas = tag_filter.feed(text)
                for meta in metas:
                    if paint_metas is not None:
                        paint_metas[meta["surfaceId"]] = meta
                    parts.append(create_paint_meta_part(meta))
            if text:
                parts.append(Part(root=TextPart(text=text)))
        if response_part.a2ui_json:
            data = response_part.a2ui_json
            for msg in data if isinstance(data, list) else [data]:
                parts.append(create_a2ui_part(msg, version=WIRE_VERSION))
        return parts

    async def cancel(
        self, context: RequestContext, event_queue: EventQueue
    ) -> Task | None:
        raise ServerError(error=UnsupportedOperationError())
