"""The tool-shaping skeleton: annotation mechanics over MCP text parts.

The kit owns the mechanics only. What a payload's notes SAY — projection detail,
counts, tallies — is vendor policy, supplied as an `annotate` hook whose return
value is attached verbatim; the kit never legislates its shape.

MCP responses arrive as `{"content": [{"type": "text", "text": "<json>"}], ...}`,
so annotations are applied inside the encoded text part. The walker builds a new
response dict rather than mutating the caller's, and it never raises: a shaping
bug must not cost a live turn, and an unshaped payload is exactly the pass-through
behavior.
"""

from __future__ import annotations

import json
import logging
import os
from collections.abc import Callable
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

SHAPE_DUMP_ENV = "TOOL_SHAPE_DUMP"

# The key vendor `annotate` hooks attach their notes under.
ANNOTATION_KEY = "_payload_notes"

# Attached (by vendor hooks) to every shaped payload. The failure it prevents is
# specific: a field the projection omits is not a field the object lacks.
PROJECTION_NOTE = (
    "This payload is a projection: it carries only the fields listed above. A field "
    "that does not appear here was NOT fetched, and its absence is not evidence that "
    "the underlying object lacks it. Never state or infer a value for a field absent "
    "from this payload — fetch it, or leave it out of the surface entirely."
)

# (payload) -> annotated copy, or None to leave the payload alone.
Annotate = Callable[[Any], Any | None]


def _dump_path(app_dir: Path) -> Path:
    return app_dir / "tool_shapes.dump.jsonl"


def describe(value: Any, depth: int = 0) -> Any:
    """A structural sketch of a payload: keys and types, never content."""
    if isinstance(value, dict):
        if depth >= 2:
            return sorted(value)
        return {k: describe(v, depth + 1) for k, v in value.items()}
    if isinstance(value, list):
        return [describe(value[0], depth + 1)] if value else []
    return type(value).__name__


def record_shape(tool_name: str, args: dict[str, Any], response: Any, *, app_dir: Path) -> None:
    """Appends the payload's SHAPE (never its content) to a dump, when asked.

    A debugging aid for prompt work: it answers "what fields does this tool actually
    return" without writing the payload itself to a file. It is also how a tool
    inventory's real argument names get pinned down on the first live run.
    """
    if not os.environ.get(SHAPE_DUMP_ENV):
        return
    try:
        line = json.dumps(
            {"tool": tool_name, "args": sorted(args or {}), "shape": describe(response)}
        )
        with _dump_path(app_dir).open("a", encoding="utf-8") as fh:
            fh.write(line + "\n")
    except (OSError, TypeError, ValueError):
        logger.debug("tool shape dump failed for %s", tool_name, exc_info=True)


def shape_tool_response(
    response: Any, tool_name: str = "tool", *, annotate: Annotate
) -> Any | None:
    """The `after_tool_callback` walker: applies `annotate` inside each JSON text part.

    Returns a new response dict when anything changed, otherwise None so the caller
    passes the original straight through, per ADK's callback contract.
    """
    try:
        if not isinstance(response, dict):
            return None
        content = response.get("content")
        if not isinstance(content, list):
            return None
        changed = False
        parts = []
        for part in content:
            text = part.get("text") if isinstance(part, dict) else None
            if not isinstance(text, str):
                parts.append(part)
                continue
            try:
                payload = json.loads(text)
            except ValueError:
                # Not JSON — a prose tool result, left untouched.
                parts.append(part)
                continue
            annotated = annotate(payload)
            if annotated is not None:
                payload = annotated
                changed = True
            parts.append({**part, "text": json.dumps(payload)})
        return {**response, "content": parts} if changed else None
    except Exception:
        logger.exception(
            "tool response shaping failed for %s; passing the payload through", tool_name
        )
        return None
