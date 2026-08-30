"""Derives the stub and deterministic corpora from a recorded live run.

Task-2.6 decision 11: one live run, three consumers. The captured MCP payloads become the
stub backend's fixtures; the recorded painted streams become the deterministic agent's
fixtures. Neither is hand-authored — that is what keeps the canned data real-shaped.

Nothing is pseudonymized on the way through, because nothing needs to be: the run reads a
seeded demo calendar whose contents are authored (task-2.7 decision 4). The payload SHAPES
are the API's own, which is the half of phase decision 1 that teaches the model what fields
exist; the values are the seed's.

    uv run python scripts/seed_calendar.py
    A2UI_RECORD_DIR=.recordings uv run python -m llm_agent --host localhost
    uv run python scripts/record_beats.py --beats 1,2,3,4 --model <model>
    uv run python scripts/derive_corpus.py

Everything this writes is tracked and therefore published, so `tests/test_corpus_is_publishable.py`
runs over the result. Do not commit a corpus that fails it.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

AGENT = Path(__file__).resolve().parent.parent
SELF_EMAIL = os.environ.get("SEED_SELF_EMAIL", "")
CAPTURED = AGENT / ".recordings" / "payloads"
BEATS = AGENT / "recordings" / "beats"
STUB = AGENT / "llm_agent" / "fixtures"
DETERMINISTIC = AGENT / "deterministic_agent" / "fixtures"

# The account's own address appears on every event the seed marks the viewer as attending.
# It is the developer's, not the demo calendar's, so it is the one real string a run against
# an authored calendar can still emit. Replaced rather than published.
SELF_PLACEHOLDER = "you@example.com"


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


def mask_self(value: object) -> object:
    """Replaces the authenticated account's own address wherever it appears.

    The seed authors every other attendee, so this is the only real identifier a capture can
    carry. It is walked over the whole payload rather than the keys we expect, because an
    address under a key nobody anticipated is exactly the one that would be published.
    """
    if isinstance(value, dict):
        return {k: mask_self(v) for k, v in value.items()}
    if isinstance(value, list):
        return [mask_self(v) for v in value]
    if isinstance(value, str) and SELF_EMAIL and SELF_EMAIL in value:
        return value.replace(SELF_EMAIL, SELF_PLACEHOLDER)
    return value


def derive_stub() -> None:
    events = richest(CAPTURED / "list_events.jsonl", "events")
    if events:
        events = mask_self(events)
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
                by_id[doc["id"]] = mask_self(doc)
        if by_id:
            write(STUB / "get-event.json", by_id, f"{len(by_id)} events")

    calendars = richest(CAPTURED / "list_calendars.jsonl", "calendars")
    if calendars:
        write(STUB / "list-calendars.json", mask_self(calendars), "calendar list")

    freebusy = richest(CAPTURED / "query_freebusy.jsonl", "busy")
    if freebusy:
        write(STUB / "query-freebusy.json", mask_self(freebusy), f"{len(freebusy['busy'])} busy")


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
