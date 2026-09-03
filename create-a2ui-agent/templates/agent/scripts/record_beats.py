"""Headless beat driver: runs this app's beats against its live agent and keeps the streams.

The agent records what it streams (the kit recorder, armed by A2UI_RECORD_DIR); the kit's
driver (`a2ui_agent_kit.beats`) supplies the mechanics — this shim carries only what is
__DISPLAY_NAME__'s: the beats, the agent URL, and the directories.

The agent must already be running:

    A2UI_RECORD_DIR=.recordings uv run python -m app --mode live --host localhost
    uv run python scripts/record_beats.py --beats 1

TODO: replace the placeholder beat with one prompt per kind of surface the app paints.
"""

from __future__ import annotations

import sys
from pathlib import Path

from a2ui_agent_kit.beats import Turn, main

AGENT_URL = "http://localhost:__PORT__"
REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_RECORD_DIR = REPO_ROOT / ".recordings"
FIXTURE_DIR = REPO_ROOT / "recordings" / "beats"

BEATS: list[Turn] = [
    Turn(1, "greeting", "Greeting", "Say hello"),
]


if __name__ == "__main__":
    sys.exit(main(BEATS, AGENT_URL, record_dir=DEFAULT_RECORD_DIR, fixture_dir=FIXTURE_DIR))
