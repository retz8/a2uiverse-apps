"""Derives the stub and deterministic corpora from a recorded live run.

Task-2.6 decision 11: one live run, three consumers. The captured MCP payloads become the
stub backend's fixtures; the recorded painted streams become the deterministic agent's
fixtures. Neither is hand-authored — that is what keeps the canned data real-shaped.

Nothing is pseudonymized on the way through, because nothing needs to be: the run reads a
seeded demo calendar whose contents are authored (task-2.7 decision 4). The payload SHAPES
are the API's own, which is the half of phase decision 1 that teaches the model what fields
exist; the values are the seed's.

    uv run python scripts/seed_calendar.py
    A2UI_RECORD_DIR=.recordings uv run python -m app --mode live --host localhost
    uv run python scripts/record_beats.py --beats 1,2,3,4 --model <model>
    uv run python scripts/derive_corpus.py

Everything this writes is tracked and therefore published, so `tests/test_corpus_is_publishable.py`
runs over the result. Do not commit a corpus that fails it.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

AGENT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(AGENT))


def _self_email() -> str:
    """The demo calendar's own address, which Google flags `self` on every seeded event.

    It is not personal data, but it is an identifier, and it is the only string in a capture
    that the authored seed did not put there. `.env` already holds it, so it is read from
    there rather than asking for a second copy in a second variable.
    """
    if os.environ.get("CALENDAR_ID"):
        return os.environ["CALENDAR_ID"]
    env = AGENT / ".env"
    if env.is_file():
        for line in env.read_text(encoding="utf-8").splitlines():
            if line.startswith("CALENDAR_ID="):
                return line.split("=", 1)[1].strip()
    return ""


SELF_EMAIL = _self_email()
# The masking walk is app.tool_shaping's (one definition); its "this address is the viewer"
# case reads CALENDAR_ID from the environment, so the .env-derived value is exported to it.
if SELF_EMAIL:
    os.environ.setdefault("CALENDAR_ID", SELF_EMAIL)

from app.tool_shaping import mask_injected_addresses  # noqa: E402

CAPTURED = AGENT / ".recordings" / "payloads"
BEATS = AGENT / "recordings" / "beats"
STUB = AGENT / "app" / "fixtures" / "stub"
DETERMINISTIC = AGENT / "app" / "fixtures" / "deterministic"


def richest(path: Path, key: str) -> dict | None:
    """The captured payload carrying the most of `key` — the most useful one to replay."""
    best = None
    if not path.is_file():
        return None
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            doc = json.loads(line)
        except ValueError:
            continue
        if not isinstance(doc, dict) or key not in doc:
            continue
        if best is None or len(doc.get(key) or []) > len(best.get(key) or []):
            best = doc
    return best


def write(path: Path, payload: object, note: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"{path.name:22} <- {note}")


def settled_messages(beat_path: Path) -> list[dict]:
    """A beat's SETTLED A2UI message sequence.

    The recorder captures the stream, so a component can appear several times as it is built
    up — a half-written component is a valid thing to see mid-stream and an invalid thing to
    can. Components are merged by id, last write winning, and emitted once.
    """
    doc = json.loads(beat_path.read_text(encoding="utf-8"))
    creates: list[dict] = []
    data: list[dict] = []
    components: dict[str, dict] = {}
    for turn in doc.get("turns", []):
        for batch in turn.get("batches", []):
            for message in batch.get("messages", []):
                if not isinstance(message, dict) or not message.get("version"):
                    continue
                if "createSurface" in message:
                    creates.append(message)
                elif "updateDataModel" in message:
                    data.append(message)
                elif "updateComponents" in message:
                    for component in message["updateComponents"].get("components", []):
                        if isinstance(component, dict) and component.get("id"):
                            components[component["id"]] = {
                                **components.get(component["id"], {}),
                                **component,
                            }
    out = [*creates, *data]
    if components:
        out.append(
            {
                "version": "v0.9",
                "updateComponents": {"components": list(components.values())},
            }
        )
    return out


def strip_links(value: object) -> object:
    """Neutralises `htmlLink`, which carries the calendar id base64-encoded in its `eid`.

    Not an address, so `mask` does not see it and the publishability guard does not either —
    but it is still an identifier bound for a public repo, and nothing on a surface uses it.
    """
    if isinstance(value, dict):
        return {
            k: ("https://example.com/event" if k == "htmlLink" else strip_links(v))
            for k, v in value.items()
        }
    if isinstance(value, list):
        return [strip_links(v) for v in value]
    return value


def clean(value: object) -> object:
    return strip_links(mask_injected_addresses(value))


def derive_stub() -> None:
    events = richest(CAPTURED / "list_events.jsonl", "events")
    if events:
        events = clean(events)
        write(STUB / "list-events.json", events, f"{len(events['events'])} events")

    event_file = CAPTURED / "get_event.jsonl"
    if event_file.is_file():
        by_id: dict[str, dict] = {}
        for line in event_file.read_text(encoding="utf-8").splitlines():
            try:
                doc = json.loads(line)
            except ValueError:
                continue
            if isinstance(doc, dict) and doc.get("id"):
                by_id[doc["id"]] = clean(doc)
        if by_id:
            write(STUB / "get-event.json", by_id, f"{len(by_id)} events")

    calendars = richest(CAPTURED / "list_calendars.jsonl", "calendars")
    if calendars:
        write(STUB / "list-calendars.json", clean(calendars), "calendar list")

    freebusy = richest(CAPTURED / "query_freebusy.jsonl", "busy")
    if freebusy:
        write(STUB / "query-freebusy.json", clean(freebusy), f"{len(freebusy['busy'])} busy")


def derive_deterministic() -> None:
    # All or nothing: a partial corpus is worse than none, because the tests that depend on
    # it key on the directory existing and would run against a half-set.
    if not BEATS.is_dir() or not any(BEATS.glob("beat-*.json")):
        print("no beats recorded — skipping the deterministic corpus")
        return

    digest = BEATS / "beat-1-agenda-digest.json"
    if digest.is_file():
        messages = settled_messages(digest)
        if messages:
            write(DETERMINISTIC / "agenda-digest.json", messages, f"{len(messages)} messages")

    # Action responses are partial updates against a surface the client already holds, so
    # they carry no createSurface.
    for beat, name in (
        ("beat-2-event-detail.json", "open-event.json"),
        ("beat-3-event-create.json", "confirm-event.json"),
        ("beat-4-rsvp-toggle.json", "rsvp-toggle.json"),
    ):
        path = BEATS / beat
        if not path.is_file():
            continue
        messages = [m for m in settled_messages(path) if "createSurface" not in m]
        if messages:
            write(DETERMINISTIC / name, messages, f"{len(messages)} messages")

    # Declining a proposal paints nothing new; the canned response says so on the live surface.
    write(
        DETERMINISTIC / "cancel-event.json",
        [
            {
                "version": "v0.9",
                "updateComponents": {
                    "components": [
                        {
                            "id": "heading",
                            "component": "Text",
                            "variant": "h3",
                            "text": "Proposal discarded",
                        }
                    ]
                },
            }
        ],
        "authored (a decline paints no new data)",
    )


if __name__ == "__main__":
    if not CAPTURED.is_dir():
        raise SystemExit(
            f"no captured payloads at {CAPTURED}. Record a run first — see agent/README.md."
        )
    derive_stub()
    derive_deterministic()
    print("\nNow run: uv run pytest tests/test_corpus_is_publishable.py")
