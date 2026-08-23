"""Optional wire recorder: persists what a turn streamed, as a replayable fixture.

A valid surface is discarded once streamed (`SURFACE_DUMP` keeps only the latest turn's
final payload, flattened). That is enough to inspect *what* the agent composed and not
enough to replay *how* it arrived: the canvas shell's transitions — progressive streaming
on an empty canvas, hold-and-swap on an occupied one — are properties of the batch
sequence, so a fixture has to preserve the batches and their order.

Armed by `A2UI_RECORD_DIR`; a `NullRecorder` otherwise, so an unarmed agent pays nothing
and behaves identically. One file per conversation (`contextId`), rewritten at the end of
every turn so a run that dies partway still leaves every completed turn on disk.

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

from a2a.types import DataPart, Part, TextPart

logger = logging.getLogger(__name__)

RECORD_DIR_ENV = "A2UI_RECORD_DIR"
WIRE_VERSION = "v0.9"
_UNSAFE_IN_FILENAME = re.compile(r"[^A-Za-z0-9._-]")


class NullRecorder:
    """The unarmed recorder: every call is a no-op."""

    def start_turn(self, **_kwargs: Any) -> None: ...

    def record_batch(self, _parts: list[Part]) -> None: ...

    def end_turn(self, _outcome: str) -> None: ...


class SessionRecorder:
    """Accumulates turns per conversation and rewrites that conversation's file after each.

    Assumes one turn is in flight at a time, which is what the beat driver does — it sends the
    next prompt only once the previous stream has closed. Two turns overlapping would interleave
    their batches into whichever started last.
    """

    def __init__(self, record_dir: Path):
        self._dir = record_dir
        self._sessions: dict[str, list[dict]] = {}
        self._context_id: str | None = None
        self._turn: dict | None = None
        self._started: float = 0.0

    def start_turn(
        self,
        *,
        context_id: str | None,
        task_id: str | None,
        kind: str,
        prompt: str,
        action: dict | None = None,
    ) -> None:
        self._context_id = context_id or self._context_id or "unknown"
        self._started = time.monotonic()
        self._turn = {
            "taskId": task_id,
            "kind": kind,
            "prompt": prompt,
            "action": action,
            "batches": [],
        }

    def record_batch(self, parts: list[Part]) -> None:
        if self._turn is None:
            # An emission outside a turn: nothing to attach it to. Recording is
            # diagnostics, so this is dropped rather than raised.
            return
        messages: list[dict] = []
        texts: list[str] = []
        for part in parts:
            root = part.root
            if isinstance(root, DataPart) and (
                root.data.get("version") == WIRE_VERSION or "paintMeta" in root.data
            ):
                # paintMeta shell parts (task 8.5) record alongside the A2UI messages,
                # so a replayed fixture exercises the titled path too.
                messages.append(root.data)
            elif isinstance(root, TextPart) and root.text:
                texts.append(root.text)
        if not messages and not texts:
            return
        self._turn["batches"].append(
            {
                "offsetMs": int((time.monotonic() - self._started) * 1000),
                "messages": messages,
                "texts": texts,
            }
        )

    def end_turn(self, outcome: str) -> None:
        if self._turn is None:
            return
        self._turn["outcome"] = outcome
        self._turn["durationMs"] = int((time.monotonic() - self._started) * 1000)
        self._sessions.setdefault(self._context_id or "unknown", []).append(self._turn)
        self._turn = None
        # Best-effort: a fixture that cannot be written must never fail a good turn.
        with contextlib.suppress(OSError, TypeError, ValueError):
            self._write()

    def _write(self) -> None:
        self._dir.mkdir(parents=True, exist_ok=True)
        context_id = self._context_id or "unknown"
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
