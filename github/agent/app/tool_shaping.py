"""Shapes MCP tool responses before the model reads them.

The model invents when a payload is silent, and miscounts when a payload makes it
do arithmetic. Both showed up in task 7.7 on different beats, and prose levers
failed on both — which is the signal that they are not prompt problems:

- **Silence reads as absence.** `search_repositories` returns a *projection*: for
  `a2ui-project/a2ui` the item carries no `description` key at all. A reader of
  that payload cannot tell "this repository has no description" from "this field
  was not fetched", so the model supplied a plausible sentence. It did so twice,
  differently, including after a domain-doc line telling it not to.
- **Arithmetic over a long list goes wrong.** A pull request's check runs arrive
  as 23 objects; the model reported "28 checks completed successfully" and
  "All checks have passed" for a payload that GitHub itself calls `unstable`.

Both are fixed by handing the model an accurate, explicit answer rather than
asking it to infer one.

**This layer never decides what a surface shows.** It adds no GitHub facts of its
own and removes nothing. It states what the payload does and does not cover, and
it counts what is already there.

MCP responses arrive as `{"content": [{"type": "text", "text": "<json>"}], ...}`,
so annotations are applied inside the encoded text part.
"""

from __future__ import annotations

import json
import logging
import os
from collections import Counter
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

SHAPE_DUMP_ENV = "TOOL_SHAPE_DUMP"

# Attached to every shaped payload. The failure it prevents is specific: a field
# the projection omits is not a field the repository lacks.
PROJECTION_NOTE = (
    "This payload is a projection: it carries only the fields listed above. A field "
    "that does not appear here was NOT fetched, and its absence is not evidence that "
    "the underlying object lacks it. Never state or infer a value for a field absent "
    "from this payload — fetch it, or leave it out of the surface entirely."
)

_ANNOTATION_KEY = "_payload_notes"

# `fields_present` describes the ENVELOPE. For a search result the envelope is
# {total_count, incomplete_results, items} — which says nothing about how thin the
# items themselves are. search_users returns four fields per user (avatar_url, id,
# login, profile_url), and beat 7 stated a name, company, location and follower
# scale off that payload. Same mechanism as the search_repositories projection: the
# item's silence was indistinguishable from the object lacking the field.
ITEM_PROJECTION_NOTE = (
    "Every entry in this result carries ONLY the fields listed in "
    "`item_fields_present`. A field missing from that list was NOT fetched for these "
    "entries — its absence here is not evidence about the underlying object, which may "
    "well have a value for it. Never state or infer such a field from this payload. If "
    "no tool available to you returns it, then it is not something you can show at all, "
    "and the honest surface omits it rather than supplying a plausible value. "
    "A field that IS listed but carries null or an empty value on a given entry is "
    "genuinely empty FOR THAT ENTRY — that emptiness is the answer for it. Entries in one "
    "list differ this way, and a value another entry carries says nothing about this one."
)

# Named, not generic. The generic projection note did not stop the model writing a
# description for a repository whose payload carried `"description": null` — so the
# empty fields are listed by name, with the reading spelled out for them.
EMPTY_FIELDS_NOTE = (
    "GitHub returned these fields EMPTY for this object. That emptiness is the answer: "
    "the object genuinely has no value for them. It is not a gap to fill and not a "
    "prompt to write something plausible. Render such a field as absent, or leave it "
    "out of the surface — never supply one of your own."
)

# A directory listing names its entries; it does not carry what is inside them, and it
# reaches exactly one level down. What may be RENDERED from a fetched file is a catalog
# fact and lives in the prompt's ROLE — stating it here too gave one rule two wordings
# and two scopes, which is how it landed on some files and not others.
DIRECTORY_LISTING_NOTE = (
    "This is a directory listing: every entry is a NAME only. No file's contents are "
    "included here, not even a README — until you fetch a path specifically, you do not "
    "know what it says, so do not describe it. Any entry here can be fetched by passing "
    "its 'path' back to this same tool, and that fetch is the only way to learn what it "
    "contains. "
    "The listing also covers exactly ONE level: an entry of type 'dir' is a name with "
    "nothing under it. What that directory contains is its own fetch, and a tree drawn "
    "from this payload alone is one level deep however it is presented."
)

_EMPTY_VALUES = (None, "", [], {})


def _dump_path() -> Path:
    return Path(__file__).resolve().parent.parent / "tool_shapes.dump.jsonl"


def _describe(value: Any, depth: int = 0) -> Any:
    """A structural sketch of a payload: keys and types, values only when small."""
    if depth > 3:
        return "…"
    if isinstance(value, dict):
        return {k: _describe(v, depth + 1) for k, v in list(value.items())[:40]}
    if isinstance(value, list):
        return {"__list__": len(value), "first": _describe(value[0], depth + 1) if value else None}
    if isinstance(value, str):
        return value if len(value) <= 120 else f"<str len={len(value)}>"
    return value


def record_shape(tool_name: str, args: dict[str, Any], response: Any) -> None:
    """Appends a structural sketch of one tool response. No-op unless enabled.

    Kept (env-gated, off by default) rather than deleted: the shaping rules below are
    only correct against real payload shapes, and the next rule will need the same look.
    """
    if not os.environ.get(SHAPE_DUMP_ENV):
        return
    try:
        line = json.dumps(
            {"tool": tool_name, "args": args, "shape": _describe(response)}, default=str
        )
        with _dump_path().open("a", encoding="utf-8") as fh:
            fh.write(line + "\n")
    except Exception:  # instrumentation must never break a turn
        logger.exception("tool shape dump failed for %s", tool_name)


def _tally_check_runs(runs: list[dict[str, Any]]) -> dict[str, Any]:
    """Counts what the model would otherwise count by hand over the run list."""
    conclusions = Counter(r.get("conclusion") for r in runs if r.get("conclusion") is not None)
    unfinished = sum(1 for r in runs if r.get("status") != "completed")
    failing = sum(conclusions[k] for k in ("failure", "timed_out", "action_required"))
    return {
        "total": len(runs),
        "by_conclusion": {str(k): v for k, v in sorted(conclusions.items())},
        "not_yet_concluded": unfinished,
        "failing": failing,
        "note": (
            "Counted from this payload, not by you. `failing` counts only failure, "
            "timed_out and action_required. Runs that were skipped or cancelled are "
            "neither failures nor successes, and runs not yet concluded have decided "
            "nothing — so a total is not a count of successes."
        ),
    }


def _empty_fields(obj: dict[str, Any]) -> list[str]:
    """Field names GitHub returned empty — present in the payload, carrying no value."""
    return sorted(k for k, v in obj.items() if not k.startswith("_") and v in _EMPTY_VALUES)


def _is_directory_listing(payload: dict[str, Any]) -> bool:
    """A `get_file_contents` listing: a list of entries each naming a path and a type."""
    for value in payload.values():
        if isinstance(value, list) and value and all(isinstance(e, dict) for e in value):
            keys = set(value[0])
            if {"name", "type"} <= keys or {"path", "type"} <= keys:
                return True
    return False


def annotate(payload: Any) -> Any | None:
    """Returns an annotated copy of one decoded payload, or None to leave it alone."""
    if not isinstance(payload, dict):
        return None
    notes: dict[str, Any] = {"fields_present": sorted(payload.keys()), "reading": PROJECTION_NOTE}

    # What the ITEMS carry, as distinct from what the envelope carries.
    items = payload.get("items")
    if isinstance(items, list) and items and isinstance(items[0], dict):
        notes["item_fields_present"] = sorted(items[0].keys())
        notes["item_fields_reading"] = ITEM_PROJECTION_NOTE

    # Empty fields, named — on the payload itself and on the single item of a
    # one-result search, which is where a repository's own fields actually live.
    subject = payload
    if isinstance(items, list) and len(items) == 1 and isinstance(items[0], dict):
        subject = items[0]
    empty = _empty_fields(subject)
    if empty:
        notes["fields_returned_empty"] = empty
        notes["empty_fields_reading"] = EMPTY_FIELDS_NOTE

    if _is_directory_listing(payload):
        notes["directory_listing_reading"] = DIRECTORY_LISTING_NOTE

    runs = payload.get("check_runs")
    if isinstance(runs, list) and runs and all(isinstance(r, dict) for r in runs):
        notes["check_run_tally"] = _tally_check_runs(runs)

    annotated = dict(payload)
    annotated[_ANNOTATION_KEY] = notes
    return annotated


def shape_tool_response(response: Any) -> Any | None:
    """Annotates the JSON carried in an MCP response's text parts.

    Returns the mutated response when anything changed, otherwise None so the caller
    passes the original straight through. Never raises: a shaping bug must not cost a
    live turn, and an unshaped payload is exactly today's behaviour.
    """
    try:
        content = response.get("content") if isinstance(response, dict) else None
        if not isinstance(content, list):
            return None
        changed = False
        for part in content:
            if not isinstance(part, dict) or part.get("type") != "text":
                continue
            text = part.get("text")
            if not isinstance(text, str):
                continue
            try:
                payload = json.loads(text)
            except (ValueError, TypeError):
                continue  # not JSON — a prose tool result, left untouched
            annotated = annotate(payload)
            if annotated is None:
                continue
            part["text"] = json.dumps(annotated)
            changed = True
        return response if changed else None
    except Exception:
        logger.exception("tool response shaping failed; passing the payload through")
        return None
