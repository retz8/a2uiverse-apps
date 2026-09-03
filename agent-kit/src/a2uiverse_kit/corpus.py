"""Record-mode corpus capture: what the model READ, beside what it painted.

The A2UI recorder (`recorder.py`) captures what the model PAINTED; this captures
the MCP payloads it read. One live run derives all three run modes (task-2.6
decision 11): the captured payloads become the stub backend's fixtures via the
agent's `scripts/derive_corpus.py`, so the stub is never hand-authored.

Both captures arm on the same switch (`A2UI_RECORD_DIR`) deliberately — a recorded
run is exactly the run whose payloads become the stub corpus. What (if anything)
must be scrubbed or masked before a payload is captured is vendor policy and stays
in the app; the kit only appends and decodes.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

from a2uiverse_kit.recorder import RECORD_DIR_ENV

logger = logging.getLogger(__name__)


def recording() -> str | None:
    """The record directory when the recorder is armed, else None."""
    return os.environ.get(RECORD_DIR_ENV) or None


def capture_payload(tool_name: str, payload: object) -> None:
    """Appends one MCP payload to the corpus the stub backend is built from."""
    record_dir = recording()
    if not record_dir:
        return
    try:
        target = Path(record_dir) / "payloads"
        target.mkdir(parents=True, exist_ok=True)
        with (target / f"{tool_name}.jsonl").open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(payload) + "\n")
    except (OSError, TypeError, ValueError):
        logger.debug("payload capture failed for %s", tool_name, exc_info=True)


def corpus_payload(result: dict) -> Any:
    """The decoded payload to record for the stub corpus, preferring the structured field."""
    structured = result.get("structuredContent")
    if isinstance(structured, dict) and structured:
        return structured
    for part in result.get("content") or []:
        if isinstance(part, dict) and isinstance(part.get("text"), str):
            try:
                return json.loads(part["text"])
            except ValueError:
                continue
    return {}
