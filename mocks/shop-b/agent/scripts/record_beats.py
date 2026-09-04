"""Headless beat driver: runs this app's beats against its live agent and keeps the streams.

The agent records what it streams (the kit recorder, armed by A2UI_RECORD_DIR); the kit's
driver (`a2ui_agent_kit.beats`) supplies the mechanics — this shim carries only what is
Northlight's: the beats, the agent URL, and the directories.

The four beats are the three things this mock exists to demonstrate (task-4.6 decision 17):
the catalogue paint, the drill-down round trip, and the reorder. The round trip is two beats
because the driver sends one prompt per beat, and going absent and coming back is two prompts.
Beats 2 to 4 update the surface beat 1 created and create none of their own, which the kit's
recorder accepts as of task-4.6 decision 15.

The agent must already be running:

    A2UI_RECORD_DIR=.recordings uv run python -m app --mode live --host localhost
    uv run python scripts/record_beats.py --model <model>
"""

from __future__ import annotations

import sys
from pathlib import Path

from a2ui_agent_kit.beats import Turn, main

AGENT_URL = "http://localhost:12002"
REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_RECORD_DIR = REPO_ROOT / ".recordings"
FIXTURE_DIR = REPO_ROOT / "recordings" / "beats"

BEATS: list[Turn] = [
    Turn(1, "catalogue", "Camera catalogue", "What cameras do you have?"),
    Turn(2, "open-camera", "One camera", "Tell me about the Orbit GM3", chains=True),
    Turn(3, "back-to-list", "Back to the catalogue", "Take me back to the list", chains=True),
    Turn(4, "sort-by-price", "Cheapest first", "Sort them cheapest first", chains=True),
]


if __name__ == "__main__":
    sys.exit(main(BEATS, AGENT_URL, record_dir=DEFAULT_RECORD_DIR, fixture_dir=FIXTURE_DIR))
