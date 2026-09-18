"""Headless beat driver: runs the three beats against the live agent and keeps the streams.

The agent records what it streams (the kit recorder, armed by A2UI_RECORD_DIR); the kit's
driver (`a2ui_agent_kit.beats`) supplies the mechanics — this shim carries only what is
Linear's: the beats, the agent URL, and the directories.

The agent must already be running, armed:

    A2UI_RECORD_DIR=.recordings uv run python -m app --mode live --host localhost
    uv run python scripts/record_beats.py --model gemini-3.7-flash

Beat 2 opens A2U-5, the issue whose pull request Linear linked by its branch name, and beat 3
really moves it to In Review in the workspace — it is the change the beat records.
"""

from __future__ import annotations

import sys
from pathlib import Path

from a2ui_agent_kit.beats import Turn, main

AGENT_URL = "http://localhost:11005"
REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_RECORD_DIR = REPO_ROOT / ".recordings"
FIXTURE_DIR = REPO_ROOT / "recordings" / "beats"

# The three beats (task-7.3 decision 10): the user's issues, one issue opened, and a status
# change proposed then confirmed. Beats 2-3 chain onto beat 1's conversation, so each acts on
# the issue the previous turn actually painted. Beat 3 is two turns, the proposal and its
# confirm, kept as two fixtures under one beat number. The kit retries a chain as a whole, so a
# retried run proposes the change again against the issue as it then stands.
BEATS: list[Turn] = [
    Turn(1, "my-issues", "My issues", "What's assigned to me in Linear?"),
    Turn(2, "issue-detail", "Issue detail", "Open A2U-5.", chains=True),
    Turn(3, "status-proposal", "Status change proposed", "Move it to In Review.", chains=True),
    Turn(3, "status-confirm", "Status change confirmed", "Yes, move it.", chains=True),
]


if __name__ == "__main__":
    sys.exit(main(BEATS, AGENT_URL, record_dir=DEFAULT_RECORD_DIR, fixture_dir=FIXTURE_DIR))
