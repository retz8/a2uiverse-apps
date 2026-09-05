"""Derives the deterministic corpus from a recorded live run.

Task 5.6. GitHub's `deterministic` mode answers a plain-text prompt with the today digest,
and that fixture is derived here rather than authored — the same rule Gmail's and Calendar's
derive scripts hold, and what keeps the canned data real-shaped.

Only the deterministic half is derived. The stub fixtures came over with the app and are not
regenerated here, and there is no pseudonymization step: GitHub's payloads are public
repository data, which is why this agent has no `test_corpus_is_publishable`.

    A2UI_RECORD_DIR=.recordings uv run python -m app --mode live --host localhost
    uv run python scripts/record_beats.py --beats 8 --model <model>
    uv run python scripts/derive_corpus.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from a2ui_agent_kit.corpus import settled_messages

AGENT = Path(__file__).resolve().parent.parent
BEATS = AGENT / "recordings" / "beats"
DETERMINISTIC = AGENT / "app" / "fixtures" / "deterministic"

# The today beat, and the fixture the text path plays.
SOURCE = "beat-8-notifications.json"
TARGET = "notifications.json"


def main() -> int:
    source = BEATS / SOURCE
    if not source.is_file():
        print(f"no recording at {source.relative_to(AGENT)} — record beat 8 first", file=sys.stderr)
        return 1

    messages = settled_messages(source)
    if not any("createSurface" in message for message in messages):
        print(f"{SOURCE} painted no surface — nothing to derive", file=sys.stderr)
        return 1

    DETERMINISTIC.mkdir(parents=True, exist_ok=True)
    (DETERMINISTIC / TARGET).write_text(
        json.dumps(messages, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"{TARGET:<22} <- {len(messages)} messages")
    return 0


if __name__ == "__main__":
    sys.exit(main())
