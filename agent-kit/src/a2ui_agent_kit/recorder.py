"""Optional wire recorder: persists what a turn streamed, as a replayable fixture.

A valid surface is discarded once streamed (`SURFACE_DUMP` keeps only the latest turn's
final payload, flattened). That is enough to inspect *what* the agent composed and not
enough to replay *how* it arrived: the canvas shell's transitions — progressive streaming
on an empty canvas, hold-and-swap on an occupied one — are properties of the batch
sequence, so a fixture has to preserve the batches and their order.

Armed by `A2UI_RECORD_DIR`; a `NullRecorder` otherwise, so an unarmed agent pays nothing
and behaves identically. One file per conversation (`contextId`), rewritten at the end of
every turn so a run that dies partway still leaves every completed turn on disk. A turn is
held by its task, so turns running at once — two accounts of one app answering together, or
a Retry beside the request it races — each keep only what they streamed.

The batch shape mirrors the split the client performs on each stream event
(`extractA2uiMessagesFromEvent` / `extractAgentTextFromEvent` in client/src/a2a/messages.ts):
version-tagged DataParts become `messages`, TextParts become `texts`. Replaying a batch is
therefore the same as receiving the event that produced it.
"""

from __future__ import annotations

import contextlib
import json
import logging
import re
import time
from pathlib import Path
from typing import Any

from a2a.types import Part

from a2ui_agent_kit.versions import A2UI_VERSIONS
from a2ui_agent_kit.wire import part_data, part_text

logger = logging.getLogger(__name__)

RECORD_DIR_ENV = "A2UI_RECORD_DIR"
_UNSAFE_IN_FILENAME = re.compile(r"[^A-Za-z0-9._-]")


class NullRecorder:
    """The unarmed recorder: every call is a no-op."""

    def start_turn(self, **_kwargs: Any) -> None: ...

    def record_batch(self, _parts: list[Part], *, task_id: str) -> None: ...

    def end_turn(
        self, _outcome: str, *, task_id: str, requests: list[dict] | None = None
    ) -> None: ...


class _OpenTurn:
    """A turn in flight: its conversation, its clock's origin, and the record being built."""

    def __init__(self, context_id: str, started: float, record: dict):
        self.context_id = context_id
        self.started = started
        self.record = record


class SessionRecorder:
    """Accumulates turns per conversation and rewrites that conversation's file after each.

    Each turn is held by its task id from `start_turn` to `end_turn`, and each batch goes to
    the turn of the task that streamed it, so turns that overlap stay apart. A conversation's
    turns are kept in the order they ended.
    """

    def __init__(self, record_dir: Path):
        self._dir = record_dir
        self._sessions: dict[str, list[dict]] = {}
        self._turns: dict[str, _OpenTurn] = {}

    def start_turn(
        self,
        *,
        context_id: str | None,
        task_id: str | None,
        kind: str,
        prompt: str,
        action: dict | None = None,
        started: float | None = None,
        model: str | None = None,
        effort: str | None = None,
    ) -> None:
        """Opens the turn of `task_id`. `started` is its origin on the monotonic clock, when the
        executor took one for the measurement too, so the batches' offsets and the requests'
        share it. `model` and `effort` are what the agent resolved at startup (a2uiverse
        task-17.3 decision 5): the agent's own word on its conditions, beside the driver's."""
        record: dict = {
            "taskId": task_id,
            "kind": kind,
            "prompt": prompt,
            "action": action,
        }
        if model is not None:
            record["model"] = model
        if effort is not None:
            record["effort"] = effort
        record["batches"] = []
        self._turns[task_id or ""] = _OpenTurn(
            context_id or "unknown",
            started if started is not None else time.monotonic(),
            record,
        )

    def record_batch(self, parts: list[Part], *, task_id: str) -> None:
        """Adds what the task `task_id` streamed in one event to its turn."""
        turn = self._turns.get(task_id)
        if turn is None:
            # An emission outside a turn: nothing to attach it to. Recording is
            # diagnostics, so this is dropped rather than raised.
            return
        messages: list[dict] = []
        texts: list[str] = []
        for part in parts:
            data = part_data(part)
            text = part_text(part)
            if isinstance(data, dict) and (
                data.get("version") in A2UI_VERSIONS or "paintMeta" in data
            ):
                # A message in any version the kit speaks is kept as it went out, stamp
                # and all (a2uiverse task-19.4). paintMeta shell parts (task 8.5) record
                # alongside the A2UI messages, so a replayed fixture exercises the titled
                # path too.
                messages.append(data)
            elif text:
                texts.append(text)
        if not messages and not texts:
            return
        turn.record["batches"].append(
            {
                "offsetMs": int((time.monotonic() - turn.started) * 1000),
                "messages": messages,
                "texts": texts,
            }
        )

    def end_turn(
        self, outcome: str, *, task_id: str, requests: list[dict] | None = None
    ) -> None:
        """Closes the turn of `task_id` with `outcome` and rewrites its conversation's file.

        A task with no turn open ends nothing: a cancel never takes the outcome of another
        task's turn, such as the Retry racing it (task-8.9 decision 6).

        `requests` is the turn's measurement — one record per model request (a2uiverse
        task-17.3 decision 4) — kept beside the batches; a turn handed none carries no
        `requests` key, as every fixture recorded before the measurement existed.
        """
        turn = self._turns.pop(task_id, None)
        if turn is None:
            return
        turn.record["outcome"] = outcome
        turn.record["durationMs"] = int((time.monotonic() - turn.started) * 1000)
        if requests is not None:
            turn.record["requests"] = requests
        self._sessions.setdefault(turn.context_id, []).append(turn.record)
        # Best-effort: a fixture that cannot be written must never fail a good turn.
        with contextlib.suppress(OSError, TypeError, ValueError):
            self._write(turn.context_id)

    def _write(self, context_id: str) -> None:
        self._dir.mkdir(parents=True, exist_ok=True)
        payload = {
            "contextId": context_id,
            "turns": self._sessions.get(context_id, []),
        }
        self._path(context_id).write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def _path(self, context_id: str) -> Path:
        # The context id reaches the filesystem, so it is reduced to a flat safe token
        # rather than trusted as a path component.
        return self._dir / f"session-{_UNSAFE_IN_FILENAME.sub('-', context_id)}.json"


def create_recorder(record_dir: str | None) -> NullRecorder | SessionRecorder:
    """A `SessionRecorder` when a directory is configured, a `NullRecorder` otherwise."""
    if not record_dir:
        return NullRecorder()
    logger.info("recording turns to %s", record_dir)
    return SessionRecorder(Path(record_dir))
