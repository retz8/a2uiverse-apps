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

import hashlib
import json
import logging
import os
import re
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

SHAPE_DUMP_ENV = "TOOL_SHAPE_DUMP"
from a2uiverse_kit.recorder import RECORD_DIR_ENV  # one definition, kit-owned

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

# The server's own parameter, read off its tool schemas on the first live run. Its enum is
# NOTIFICATION_LEVEL_UNSPECIFIED | NONE | EXTERNAL_ONLY | ALL, and — the reason this guard
# exists rather than merely tidies — **unspecified is documented as "Treated as ALL"**. The
# default is to email every attendee. Omitting the argument is not the safe choice; it is the
# loud one.
#
# An earlier draft pinned `sendUpdates`/`sendNotifications`, which is the REST API v3 spelling
# and does not exist on this server. It would have set two arguments nothing reads and
# suppressed nothing at all. Hence: no guessed argument names here, and the test asserts the
# effect on a real tool schema's vocabulary rather than on ours.
_NOTIFICATION_ARG = "notificationLevel"
_SILENT = "NONE"

# The calendar the agent is confined to. Read from the environment rather than passed in, so
# that a code path which forgets to thread it through still cannot escape the demo calendar.
CALENDAR_ID_ENV = "CALENDAR_ID"

# Every admitted tool that takes one; a tool without it is unaffected.
_CALENDAR_ARG = "calendarId"


def suppress_notifications(args: dict[str, Any], accepts: set[str] | None = None) -> dict[str, Any]:
    """Forces every call that CAN notify to be non-notifying.

    `accepts` is the parameter set the tool actually declares, read off its own MCP schema.
    Passing it is what makes this safe to apply to the whole surface: the server rejects an
    argument a tool does not declare with a hard 400 ("Unknown name ... Cannot find field"),
    so an unconditional pin would take every read down. Verified against the live server —
    `list_events` with a `notificationLevel` is a 400, without it a 200.

    Omit `accepts` and the pin is applied unconditionally; that path exists for unit tests
    that are asserting the rewrite itself, not for calls.

    Returns a new dict; the caller's is not mutated.
    """
    if not isinstance(args, dict):
        return args
    if accepts is not None and _NOTIFICATION_ARG not in accepts:
        return dict(args)
    guarded = dict(args)
    if guarded.get(_NOTIFICATION_ARG, _SILENT) != _SILENT:
        logger.info(
            "notification suppressed: %s %s -> %s",
            _NOTIFICATION_ARG,
            guarded[_NOTIFICATION_ARG],
            _SILENT,
        )
    guarded[_NOTIFICATION_ARG] = _SILENT
    return guarded


def pin_calendar(args: dict[str, Any], accepts: set[str] | None = None) -> dict[str, Any]:
    """Forces every call onto the seeded demo calendar.

    `calendarId` is a per-call argument on this server, and the API's default is the
    authenticated user's `primary`. Nothing in the prompt or the tool inventory prevents the
    model from reading `primary` — it would simply be a plausible-looking argument — and that
    is the developer's real calendar, which task-2.7 decision 4 exists to keep out of a
    recording bound for a public repo.

    So the confinement is enforced here rather than asked for: the value is overwritten, not
    defaulted. Every admitted tool declares `calendarId`, which is not a coincidence — a tool
    that does not cannot be confined, and the two the server offers that do not
    (`search_events`, `list_calendars`) are withheld for exactly that reason.

    `accepts` is honoured for the same 400 that governs suppression above.

    Returns a new dict; the caller's is not mutated.
    """
    if not isinstance(args, dict):
        return args
    if accepts is not None and _CALENDAR_ARG not in accepts:
        return dict(args)
    calendar_id = os.environ.get(CALENDAR_ID_ENV)
    if not calendar_id:
        return dict(args)
    guarded = dict(args)
    if guarded.get(_CALENDAR_ARG, calendar_id) != calendar_id:
        logger.info(
            "calendar pinned: %s %s -> %s", _CALENDAR_ARG, guarded[_CALENDAR_ARG], calendar_id
        )
    guarded[_CALENDAR_ARG] = calendar_id
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


# RFC 2606 reserves these precisely so they cannot belong to anyone. On a seeded calendar
# every authored address is already one of them, so anything outside them is a field Google
# injected rather than one the seed wrote.
_ALLOWED_DOMAINS = ("example.com", "example.org", "example.net", "invalid")

_ADDRESS = re.compile(r"[\w.+-]+@[\w.-]+\.[a-z]{2,}", re.IGNORECASE)


def _stand_in(address: str) -> str:
    """A stable replacement, so a re-recorded beat reproduces the same value."""
    if address.lower() == (os.environ.get(CALENDAR_ID_ENV) or "").lower():
        return "you@example.com"
    return f"person-{hashlib.sha256(address.lower().encode()).hexdigest()[:8]}@example.com"


def mask_injected_addresses(value: Any) -> Any:
    """Replaces addresses the seed did not author. Record mode only; see capture_tool_result.

    Task-2.7 decision 4 removed Gmail's pseudonymizer on the grounds that a seeded calendar
    has nothing real to substitute. The first live run showed one exception: Google stamps
    `creator.email` with the account that created the event, which is a real person and is not
    authored by anything in `seed_events.json`. The corpus guard caught it in a fixture.

    So the premise needed narrowing rather than the decision reversing. This is not Gmail's
    substitution — it does not touch titles, notes, times or attendees, all of which stay
    exactly as the seed wrote them. It replaces only addresses outside the reserved example
    domains, which on this calendar means only the fields Google injects.

    It masks by RULE, not by known value. Enumerating what to replace is how both this task
    and 2.6 leaked; enumerating what may survive is the fix.
    """
    if isinstance(value, dict):
        return {k: mask_injected_addresses(v) for k, v in value.items()}
    if isinstance(value, list):
        return [mask_injected_addresses(v) for v in value]
    if isinstance(value, str):
        return _ADDRESS.sub(
            lambda m: m.group(0)
            if m.group(0).lower().endswith(_ALLOWED_DOMAINS)
            else _stand_in(m.group(0)),
            value,
        )
    return value


def capture_tool_result(result: Any, tool_name: str = "tool") -> Any:
    """Masks Google-injected addresses and records the result to the corpus, in record mode.

    The masked dict is what is RETURNED, not merely what is captured. That is task 2.6's
    hard-won lesson applied: `CallToolResult` carries the same payload twice, in `content` and
    in `structuredContent`, and rewriting one while returning the other is how a clean corpus
    ends up beside a dirty painted stream. Here there is one dict, it is masked whole, and the
    corpus is taken from the same object the model reads — so the two cannot disagree.

    Outside record mode nothing is touched: the live agent sees the real calendar.
    """
    if not recording() or not isinstance(result, dict):
        return result
    masked = mask_injected_addresses(result)
    capture_payload(tool_name, _corpus_payload(masked))
    return masked


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
