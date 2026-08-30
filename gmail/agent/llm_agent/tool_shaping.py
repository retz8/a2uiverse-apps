"""Shapes MCP tool responses before the model reads them.

Two jobs, both applied inside the encoded text part of an MCP response
(`{"content": [{"type": "text", "text": "<json>"}], ...}`).

**Pseudonymization, in record mode only (task-2.6 decision 8).** The mailbox is real and
the repositories that hold the fixtures are public, so no real mail may reach a tracked
artifact. Substituting at the *sink* -- rewriting the recorded stream afterwards -- means
identifying private strings by inspection inside a component tree the model authored, and
every miss is a real address pushed to a public repo. So the substitution happens at the
*source*: when `A2UI_RECORD_DIR` is set, every MCP payload passes through a deterministic,
length-preserving pseudonymizer on a fixed seed BEFORE the model sees it. The model then
paints fake content natively and the stream is clean by construction -- there is nothing
downstream to miss. The live, non-recording path is untouched and fully real.

The seed is fixed so a re-recorded beat reproduces the same substituted values and still
matches its committed screenshot baseline.

**Projection notes.** The model invents when a payload is silent: a field the projection
omits is not a field the object lacks. This layer never decides what a surface shows -- it
adds no Gmail facts of its own and removes nothing. It states what the payload does and
does not cover.
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
RECORD_DIR_ENV = "A2UI_RECORD_DIR"

# Attached to every shaped payload. The failure it prevents is specific: a field the
# projection omits is not a field the message lacks.
PROJECTION_NOTE = (
    "This payload is a projection: it carries only the fields listed above. A field "
    "that does not appear here was NOT fetched, and its absence is not evidence that "
    "the underlying object lacks it. Never state or infer a value for a field absent "
    "from this payload — fetch it, or leave it out of the surface entirely."
)

# A thread read returns message metadata, not bodies. Stating the count explicitly stops
# the model reporting a thread length it inferred from however many entries it rendered.
THREAD_COUNT_NOTE = (
    "`message_count` is the authoritative number of messages in this thread. Do not "
    "count entries yourself, and do not describe the thread as longer or shorter than it."
)

_ANNOTATION_KEY = "_payload_notes"

# ---------------------------------------------------------------------------
# Pseudonymization
# ---------------------------------------------------------------------------

# Fixed so a re-recorded beat produces the same substitutions and still matches its
# committed baseline. Changing it invalidates every tracked fixture.
_SEED = "a2uiverse-gmail-2.6"

# Values under these keys are addresses, or "Display Name <addr>" pairs.
_ADDRESS_KEYS = frozenset(
    {
        "sender",
        "from",
        "to",
        "cc",
        "bcc",
        "replyTo",
        "toRecipients",
        "ccRecipients",
        "bccRecipients",
        "deliveredTo",
    }
)

# Values under these keys are free prose.
_TEXT_KEYS = frozenset({"subject", "snippet", "body", "htmlBody", "textBody", "preview"})

# Gmail's own labels. Their names are protocol, not content: the agent's logic and the domain
# doc both key on them, and they say nothing about the person. USER labels are the opposite —
# someone wrote "Medical" or "Job applications" by hand — so `name` is substituted unless it
# is one of these or a CATEGORY_ tab.
_SYSTEM_LABELS = frozenset(
    {
        "INBOX", "SENT", "DRAFT", "SPAM", "TRASH", "UNREAD", "STARRED", "IMPORTANT",
        "CHAT", "SCHEDULED", "SNOOZED", "YELLOW_STAR", "PERSONAL",
    }
)

_ADDRESS_RE = re.compile(r"^\s*(?:\"?(?P<name>[^\"<]*?)\"?\s*)?<?(?P<addr>[^\s<>]+@[^\s<>]+)>?\s*$")

# For prose that is not structured JSON: catch addresses wherever they appear in the text.
_ADDRESS_IN_TEXT = re.compile(r"[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}")

_FIRST = (
    "Alex", "Priya", "Jonas", "Mei", "Tomas", "Sara", "Idris", "Nora",
    "Lucas", "Hana", "Omar", "Elin", "Dmitri", "Yuki", "Ravi", "Clara",
)
_LAST = (
    "Bergman", "Nakamura", "Okonkwo", "Vasquez", "Lindqvist", "Haddad",
    "Moreau", "Tanaka", "Silva", "Novak", "Ferreira", "Kowalski",
)
_WORDS = (
    "review", "update", "notes", "schedule", "draft", "summary", "follow", "status",
    "question", "revision", "meeting", "proposal", "timeline", "feedback", "agenda",
    "reply", "thread", "attached", "section", "estimate", "confirm", "pending",
)


def _digest(value: str) -> int:
    """A stable integer for a string — the same input always picks the same replacement."""
    return int.from_bytes(hashlib.sha256((_SEED + value).encode("utf-8")).digest()[:8], "big")


def _fake_person(value: str) -> str:
    h = _digest(value)
    return f"{_FIRST[h % len(_FIRST)]} {_LAST[(h // len(_FIRST)) % len(_LAST)]}"


def _fake_address(value: str) -> str:
    h = _digest(value)
    first = _FIRST[h % len(_FIRST)].lower()
    last = _LAST[(h // len(_FIRST)) % len(_LAST)].lower()
    return f"{first}.{last}@example.com"


def _fake_prose(value: str) -> str:
    """Word-structured filler of the same length.

    Length matters: the recorded stream drives pixel baselines, so a 47-character subject
    replaced by "Lorem ipsum" reflows the layout into a different picture.
    """
    if not value:
        return value
    target = len(value)
    words: list[str] = []
    h = _digest(value)
    length = 0
    while length < target:
        word = _WORDS[h % len(_WORDS)]
        h //= len(_WORDS) or 1
        if h == 0:
            h = _digest(word + str(length))
        words.append(word)
        length += len(word) + 1
    text = " ".join(words)
    return text[:target].rstrip() if len(text) >= target else text.ljust(target)


def _pseudonymize_address(value: str) -> str:
    match = _ADDRESS_RE.match(value)
    if not match:
        return _fake_prose(value)
    addr = _fake_address(match.group("addr"))
    name = match.group("name")
    return f"{_fake_person(name)} <{addr}>" if name else addr


def pseudonymize(value: Any, key: str | None = None) -> Any:
    """Walks a decoded payload, replacing private strings with stable stand-ins."""
    if isinstance(value, dict):
        return {k: pseudonymize(v, k) for k, v in value.items()}
    if isinstance(value, list):
        return [pseudonymize(v, key) for v in value]
    if isinstance(value, str) and key:
        if key in _ADDRESS_KEYS:
            return _pseudonymize_address(value)
        if key in _TEXT_KEYS:
            return _fake_prose(value)
        if key == "name" and not _is_system_label(value):
            return _fake_prose(value)
    return value


def _is_system_label(value: str) -> bool:
    return value in _SYSTEM_LABELS or value.startswith("CATEGORY_")


def recording() -> str | None:
    """The record directory when the recorder is armed, else None.

    One switch arms three things: the A2UI stream capture, pseudonymization, and the MCP
    payload capture below. They belong together — a recorded run is exactly the run whose
    payloads become the stub corpus.
    """
    return os.environ.get(RECORD_DIR_ENV) or None


def capture_payload(tool_name: str, payload: object) -> None:
    """Appends a pseudonymized MCP payload to the corpus the stub backend is built from.

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
    return" without putting mail in a file.
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
    messages = payload.get("messages")
    if isinstance(messages, list):
        annotated["message_count"] = len(messages)
        notes.append(THREAD_COUNT_NOTE)
    threads = payload.get("threads")
    if isinstance(threads, list):
        annotated["thread_count"] = len(threads)
    annotated[_ANNOTATION_KEY] = notes
    return annotated


def scrub_tool_result(result: Any, tool_name: str = "tool") -> Any:
    """Pseudonymizes an MCP CallToolResult dict IN FULL, in record mode.

    This is the substitution boundary. It runs inside the tool, on the dict the tool is about
    to return, so there is no copy for the model to read instead.

    An `after_tool_callback` was the first attempt and it leaked: `CallToolResult` carries
    BOTH `content` (text parts) and `structuredContent` (the same payload, already parsed).
    Rewriting only the text parts left the structured field real, and that is the one the
    model reads — the captured corpus was clean while the painted stream was not. So this
    walks EVERY branch of the result rather than the branches we happen to know about, and
    the corpus is captured from what it returns.
    """
    if not recording() or not isinstance(result, dict):
        return result

    scrubbed: dict[str, Any] = {}
    for key, value in result.items():
        if key == "content" and isinstance(value, list):
            scrubbed[key] = [_scrub_content_part(part) for part in value]
        else:
            # structuredContent, and anything else the result grows: pseudonymize the whole
            # branch. A key we do not recognise is a key we must not pass through untouched.
            scrubbed[key] = pseudonymize(value, key)

    capture_payload(tool_name, _corpus_payload(scrubbed))
    return scrubbed


def _scrub_content_part(part: Any) -> Any:
    """Pseudonymizes one MCP content part, JSON-encoded text included."""
    if not isinstance(part, dict):
        return part
    text = part.get("text")
    if not isinstance(text, str):
        return pseudonymize(part)
    try:
        payload = json.loads(text)
    except ValueError:
        # Non-JSON prose: substitute addresses in place rather than pass it through. A part
        # this layer cannot parse is exactly where a real string would otherwise survive.
        return {**part, "text": _ADDRESS_IN_TEXT.sub(lambda m: _fake_address(m.group(0)), text)}
    return {**part, "text": json.dumps(pseudonymize(payload))}


def _corpus_payload(scrubbed: dict) -> Any:
    """The decoded payload to record for the stub corpus, preferring the structured field."""
    structured = scrubbed.get("structuredContent")
    if isinstance(structured, dict) and structured:
        return structured
    for part in scrubbed.get("content") or []:
        if isinstance(part, dict) and isinstance(part.get("text"), str):
            try:
                return json.loads(part["text"])
            except ValueError:
                continue
    return {}


def shape_tool_response(response: Any, tool_name: str = "tool") -> Any | None:
    """The `after_tool_callback` body: projection notes only.

    Returns None to pass the response through untouched, per ADK's callback contract.

    Pseudonymization deliberately does NOT happen here. It runs inside the tool
    (`scrub_tool_result`), for the reason that module documents, and running it in both
    places would substitute already-substituted values — leaving the recorded corpus and the
    painted stream disagreeing about names that are both fake.
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
