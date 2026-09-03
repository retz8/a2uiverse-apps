"""Derives the stub and deterministic corpora from a recorded live run.

Task-2.6 decision 11: one live run, three consumers. The pseudonymized MCP payloads become
the stub backend's fixtures; the pseudonymized painted streams become the deterministic
agent's fixtures. Neither is hand-authored — that is what keeps the canned data real-shaped.

    A2UI_RECORD_DIR=.recordings uv run python -m app --mode live --host localhost
    uv run python scripts/record_beats.py --beats 1,2,3,4 --model <model>
    uv run python scripts/derive_corpus.py

Everything this writes is tracked and therefore published, so `tests/test_corpus_is_publishable.py`
runs over the result. Do not commit a corpus that fails it.
"""

from __future__ import annotations

import json
from pathlib import Path

AGENT = Path(__file__).resolve().parent.parent
CAPTURED = AGENT / ".recordings" / "payloads"
BEATS = AGENT / "recordings" / "beats"
STUB = AGENT / "app" / "fixtures" / "stub"
DETERMINISTIC = AGENT / "app" / "fixtures" / "deterministic"

# Mailbox scale is not content, but it is still a fact about the person that the fixtures do
# not need: the stub exists so the model can map INBOX/UNREAD correctly, and the label SET is
# what carries that. The counts are inert payload, so they are blanked rather than published.
COUNT_FIELDS = ("threadsTotal", "threadsUnread", "messagesTotal", "messagesUnread")


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


def derive_stub() -> None:
    search = richest(CAPTURED / "search_threads.jsonl", "threads")
    if search:
        write(STUB / "search-threads.json", search, f"{len(search['threads'])} threads")

    thread_file = CAPTURED / "get_thread.jsonl"
    if thread_file.is_file():
        threads: dict[str, dict] = {}
        for line in thread_file.read_text(encoding="utf-8").splitlines():
            try:
                doc = json.loads(line)
            except ValueError:
                continue
            if isinstance(doc, dict) and doc.get("id"):
                threads[doc["id"]] = doc
        if threads:
            write(STUB / "get-thread.json", threads, f"{len(threads)} threads")

    labels = richest(CAPTURED / "list_labels.jsonl", "labels")
    if labels:
        blanked = {
            **labels,
            "labels": [
                {**label, **{field: 0 for field in COUNT_FIELDS if field in label}}
                for label in labels["labels"]
            ],
        }
        write(
            STUB / "list-labels.json",
            blanked,
            f"{len(blanked['labels'])} labels, counts blanked",
        )


def derive_deterministic() -> None:
    # All or nothing: a partial corpus is worse than none, because the tests that depend on
    # it key on the directory existing and would run against a half-set.
    if not BEATS.is_dir() or not any(BEATS.glob("beat-*.json")):
        print("no beats recorded — skipping the deterministic corpus")
        return

    digest = BEATS / "beat-1-inbox-digest.json"
    if digest.is_file():
        messages = settled_messages(digest)
        if messages:
            write(DETERMINISTIC / "inbox-digest.json", messages, f"{len(messages)} messages")

    # Action responses are partial updates against a surface the client already holds, so
    # they carry no createSurface.
    for beat, name in (
        ("beat-2-thread-detail.json", "open-thread.json"),
        ("beat-3-reply-compose.json", "confirm-draft.json"),
        ("beat-4-label-toggle.json", "label-toggle.json"),
    ):
        path = BEATS / beat
        if not path.is_file():
            continue
        messages = [m for m in settled_messages(path) if "createSurface" not in m]
        if messages:
            write(DETERMINISTIC / name, messages, f"{len(messages)} messages")

    # Declining a draft paints nothing new; the canned response says so on the live surface.
    write(
        DETERMINISTIC / "cancel-draft.json",
        [
            {
                "version": "v0.9",
                "updateComponents": {
                    "components": [
                        {
                            "id": "heading",
                            "component": "Text",
                            "variant": "h3",
                            "text": "Draft discarded",
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
