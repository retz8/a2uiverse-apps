"""Shapes Calendar MCP traffic on its way out and on its way back.

Three jobs, and it is worth being precise about which of them is a safety boundary.

**Notification suppression, on every call, in every mode (task-2.7 decision 2).** Calendar's
writes reach third parties: creating or changing an event mails its attendees and changes
their calendars, where trashing mail is private and reversible. `suppress_notifications`
forces the notification parameter to its non-notifying value on every outbound call. This is
a genuine second layer -- Gmail had only the tool filter, because no Gmail scope grants
labelling without also granting trash and spam. It is not a bigger claim than it is: it stops
the invitations, it does not stop the event existing. An event created this way is one its
attendees do not know about, and the painted proposal is required to say so.

**Projection notes.** The model invents when a payload is silent: a field the projection omits
is not a field the object lacks. This layer never decides what a surface shows -- it adds no
Calendar facts of its own and removes nothing. It states what the payload does and does not
cover.

**Corpus capture, in record mode only.** What the model READ, alongside the A2UI recorder's
capture of what it PAINTED. `scripts/derive_corpus.py` turns the pair into the stub backend's
fixtures and the deterministic agent's, so all three run modes come from one live run.

**There is no pseudonymizer here, and that is deliberate (task-2.7 decision 4).** Gmail needed
one because an account has exactly one mailbox: reading Gmail live means reading real mail, so
every payload had to be scrubbed before it could reach a public repo. Calendar is not shaped
like that -- `calendarId` is a first-class parameter and one account holds many calendars, so
the agent reads a seeded demo calendar whose contents are authored (`scripts/seed_calendar.py`).
The corpus is clean by construction rather than by a substitution pass whose completeness
nobody can prove, and the failure mode Gmail hit the hard way -- rewriting one branch of a
`CallToolResult` while the model read the other -- cannot occur when there is nothing to
rewrite.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

SHAPE_DUMP_ENV = "TOOL_SHAPE_DUMP"
RECORD_DIR_ENV = "A2UI_RECORD_DIR"

# Attached to every shaped payload. The failure it prevents is specific: a field the
# projection omits is not a field the message lacks.
PROJECTION_NOTE = (
    "This payload is a projection: it carries only the fields listed above. A field "
    "that does not appear here was NOT fetched, and its absence is not evidence that "
    "the underlying object lacks it. Never state or infer a value for a field absent "
    "from this payload — fetch it, or leave it out of the surface entirely."
)

# An event list is a window over a time range, not the calendar. Stating the count explicitly
# stops the model reporting a day as busier or emptier than the query actually covered.
EVENT_COUNT_NOTE = (
    "`event_count` is the authoritative number of events this query returned. Do not "
    "count entries yourself, and do not describe the range as fuller or emptier than it. "
    "It is a count of what the query covered, not of everything on the calendar."
)

_ANNOTATION_KEY = "_payload_notes"

# ---------------------------------------------------------------------------
# Notification suppression
# ---------------------------------------------------------------------------

# Both spellings the Calendar API has used for "tell the attendees". The modern one is an
# enum, the legacy one a boolean; which of them this server's tools take is not recorded
# anywhere (task-2.7 spec, open item 1), so both are pinned rather than guessed between.
_SEND_UPDATES_ARG = "sendUpdates"
_SEND_NOTIFICATIONS_ARG = "sendNotifications"

_SILENT_UPDATES = "none"


def suppress_notifications(args: dict[str, Any]) -> dict[str, Any]:
    """Forces every outbound call to be non-notifying.

    Applied unconditionally, to reads as well as writes: a read that carries neither argument
    is unchanged, and pinning the value rather than checking a tool allow-list means a tool
    admitted later cannot quietly acquire the ability to mail people.

    Returns a new dict; the caller's is not mutated.
    """
    if not isinstance(args, dict):
        return args
    guarded = dict(args)
    if _SEND_UPDATES_ARG in guarded and guarded[_SEND_UPDATES_ARG] != _SILENT_UPDATES:
        logger.info("notification suppressed: %s -> %s", _SEND_UPDATES_ARG, _SILENT_UPDATES)
    if _SEND_NOTIFICATIONS_ARG in guarded and guarded[_SEND_NOTIFICATIONS_ARG] is not False:
        logger.info("notification suppressed: %s -> False", _SEND_NOTIFICATIONS_ARG)
    guarded[_SEND_UPDATES_ARG] = _SILENT_UPDATES
    guarded[_SEND_NOTIFICATIONS_ARG] = False
    return guarded


# ---------------------------------------------------------------------------
# Corpus capture
# ---------------------------------------------------------------------------


def recording() -> str | None:
    """The record directory when the recorder is armed, else None.

    One switch arms two things: the A2UI stream capture and the MCP payload capture below.
    They belong together — a recorded run is exactly the run whose payloads become the stub
    corpus.
    """
    return os.environ.get(RECORD_DIR_ENV) or None


def capture_payload(tool_name: str, payload: object) -> None:
    """Appends an MCP payload to the corpus the stub backend is built from.

    The A2UI recorder captures what the model PAINTED; this captures what it READ. Decision
    11 derives all three run modes from one live run, and the stub backend needs the payload
    side of it — otherwise the stub would have to be hand-authored, which is the thing that
    decision exists to prevent.
    """
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


def capture_tool_result(result: Any, tool_name: str = "tool") -> Any:
    """Records an MCP CallToolResult to the corpus, in record mode. Returns it unchanged.

    Gmail's counterpart at this seam also pseudonymized, and had to walk every branch of the
    result because `CallToolResult` carries both `content` and `structuredContent` — the same
    payload twice, and rewriting one left the other real. Nothing is rewritten here, so that
    hazard is gone; the result is passed through exactly as the server sent it, and only a
    copy is written to the corpus.
    """
    if not recording() or not isinstance(result, dict):
        return result
    capture_payload(tool_name, _corpus_payload(result))
    return result


def _corpus_payload(result: dict) -> Any:
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


# ---------------------------------------------------------------------------
# Shaping
# ---------------------------------------------------------------------------


def _dump_path() -> Path:
    return Path(__file__).resolve().parent.parent / "tool_shapes.dump.jsonl"


def _describe(value: Any, depth: int = 0) -> Any:
    if isinstance(value, dict):
        if depth >= 2:
            return sorted(value)
        return {k: _describe(v, depth + 1) for k, v in value.items()}
    if isinstance(value, list):
        return [_describe(value[0], depth + 1)] if value else []
    return type(value).__name__


def record_shape(tool_name: str, args: dict[str, Any], response: Any) -> None:
    """Appends the payload's SHAPE (never its content) to a dump, when asked.

    A debugging aid for prompt work: it answers "what fields does this tool actually
    return" without writing the payload itself to a file. It is also how the tool inventory's
    real argument names get pinned down on the first live run.
    """
    if not os.environ.get(SHAPE_DUMP_ENV):
        return
    try:
        line = json.dumps(
            {"tool": tool_name, "args": sorted(args or {}), "shape": _describe(response)}
        )
        with _dump_path().open("a", encoding="utf-8") as fh:
            fh.write(line + "\n")
    except (OSError, TypeError, ValueError):
        logger.debug("tool shape dump failed for %s", tool_name, exc_info=True)


def annotate(payload: Any) -> Any | None:
    """Adds projection notes to a decoded payload. Returns None when nothing applies."""
    if not isinstance(payload, dict):
        return None
    notes = [PROJECTION_NOTE]
    annotated = dict(payload)
    events = payload.get("events")
    if isinstance(events, list):
        annotated["event_count"] = len(events)
        notes.append(EVENT_COUNT_NOTE)
    annotated[_ANNOTATION_KEY] = notes
    return annotated


def shape_tool_response(response: Any, tool_name: str = "tool") -> Any | None:
    """The `after_tool_callback` body: projection notes only.

    Returns None to pass the response through untouched, per ADK's callback contract.
    """
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
            parts.append(part)
            continue
        annotated = annotate(payload)
        if annotated is not None:
            payload = annotated
            changed = True
        parts.append({**part, "text": json.dumps(payload)})
    return {**response, "content": parts} if changed else None
