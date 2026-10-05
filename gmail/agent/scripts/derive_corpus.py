"""Derives the deterministic corpus from the recorded beats.

The stub's mail is written by hand in the MCP payloads' captured shapes (task 10.11,
amending task-2.6 decision 11), so the stub is its own source and nothing here writes it. The
beats are recorded against it, and their painted streams become the deterministic agent's
fixtures. Each fake account has its own mailbox, beats and fixtures (task-12.11), so a run
derives one account's:

    A2UI_RECORD_DIR=.recordings uv run python -m app --mode stub --host localhost
    uv run python scripts/record_beats.py --account <account> --model <model>
    uv run python scripts/derive_corpus.py --account <account>

Everything this writes is tracked and therefore published, so `tests/test_corpus_is_publishable.py`
runs over the result. Do not commit a corpus that fails it.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from a2ui_agent_kit.corpus import settled_messages

AGENT = Path(__file__).resolve().parent.parent
BEATS = AGENT / "recordings" / "beats"
DETERMINISTIC = AGENT / "app" / "fixtures" / "deterministic"


def write(path: Path, payload: object, note: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"{path.name:22} <- {note}")


def derive_deterministic(account: str) -> None:
    beats = BEATS / account
    deterministic = DETERMINISTIC / account
    # All or nothing: a partial corpus is worse than none, because the tests that depend on
    # it key on the directory existing and would run against a half-set.
    if not beats.is_dir() or not any(beats.glob("beat-*.json")):
        print("no beats recorded — skipping the deterministic corpus")
        return

    digest = beats / "beat-1-inbox-digest.json"
    if digest.is_file():
        messages = settled_messages(digest)
        if messages:
            write(deterministic / "inbox-digest.json", messages, f"{len(messages)} messages")

    # A drill-down is a new screen, as the live agent paints it, so it keeps its createSurface
    # and the kit answers it on a fresh surface; every other action response is a partial
    # update against a surface the client already holds, so it carries no createSurface.
    for beat, name in (
        ("beat-2-thread-detail.json", "open-thread.json"),
        ("beat-3-reply-compose.json", "confirm-draft.json"),
        ("beat-4-label-toggle.json", "label-toggle.json"),
    ):
        path = beats / beat
        if not path.is_file():
            continue
        messages = [
            m
            for m in settled_messages(path)
            if (name == "open-thread.json" or "createSurface" not in m)
            # The confirm replays the question's paint as its answer: the answer is no question.
            and not (name == "confirm-draft.json" and "paintMeta" in m)
        ]
        if messages:
            write(deterministic / name, messages, f"{len(messages)} messages")

    # Declining a draft paints nothing new; the canned response says so on the live surface.
    write(
        deterministic / "cancel-draft.json",
        [
            {
                "version": "v0.9",
                "updateComponents": {
                    "components": [
                        {"id": "root", "component": "Surface", "child": "declined", "container": "low"},
                        {"id": "declined", "component": "Text", "text": "Draft discarded"},
                    ]
                },
            }
        ],
        "authored (a decline paints no new data)",
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--account", required=True, help="the fake account whose beats to derive")
    derive_deterministic(parser.parse_args().account)
    print("\nNow run: uv run pytest tests/test_corpus_is_publishable.py")
