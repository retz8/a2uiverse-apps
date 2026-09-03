"""GitHub's shaping policy: projection notes, empty-field naming, and counting (task 7.7).

The mechanics — the annotation walker, the shape dump — are the kit's
(`a2uiverse_kit.tool_shaping`); this module carries what is GitHub's alone.

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
"""

from __future__ import annotations

from collections import Counter
from pathlib import Path
from typing import Any

from a2uiverse_kit import tool_shaping as kit_shaping
from a2uiverse_kit.tool_shaping import ANNOTATION_KEY as _ANNOTATION_KEY
from a2uiverse_kit.tool_shaping import PROJECTION_NOTE

__all__ = [
    "PROJECTION_NOTE",
    "annotate",
    "record_shape",
    "shape_tool_response",
]

_AGENT_DIR = Path(__file__).resolve().parent.parent  # github/agent/

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


def record_shape(tool_name: str, args: dict[str, Any], response: Any) -> None:
    return kit_shaping.record_shape(tool_name, args, response, app_dir=_AGENT_DIR)


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


def shape_tool_response(response: Any, tool_name: str = "tool") -> Any | None:
    """The `after_tool_callback` body: annotation only, via the kit walker."""
    return kit_shaping.shape_tool_response(response, tool_name, annotate=annotate)
