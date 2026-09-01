"""Headless beat driver: runs the four beats against a live agent and keeps the streams.

Task 8.1. The agent records what it streams (the kit recorder, armed by
A2UI_RECORD_DIR); the kit's driver (`a2uiverse_kit.beats`) supplies the mechanics —
this shim carries only what is Calendar's: the beats, the agent URL, and the
directories.

The agent must already be running against the seeded demo calendar
(`scripts/seed_calendar.py`). The model is an agent-startup concern (ADK builds the
LlmAgent once), so a beat that needs a different rung of the model ladder is driven in
a separate invocation against a separately-started agent:

    A2UI_RECORD_DIR=.recordings uv run python -m app --mode live --host localhost
    uv run python scripts/record_beats.py --beats 1,4 --model gemini-3.5-flash
"""

from __future__ import annotations

import sys
from pathlib import Path

from a2uiverse_kit.beats import Turn, main

AGENT_URL = "http://localhost:11003"
REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_RECORD_DIR = REPO_ROOT / ".recordings"
FIXTURE_DIR = REPO_ROOT / "recordings" / "beats"

# The four beats (task-2.6 decision 9), one per kind of surface: list, detail, creating
# write, toggling write. Beats 2 and 3 chain onto beat 1s conversation, so the detail
# and the proposed event follow from the agenda the run actually opened.
BEATS: list[Turn] = [
    Turn(1, "agenda-digest", "Agenda digest", "What needs my attention today?"),
    Turn(2, "event-detail", "Event detail", "Open the design review.", chains=True),
    Turn(3, "event-create", "Propose-and-confirm event",
         "Put half an hour with the design team on Thursday afternoon.", chains=True),
    Turn(4, "rsvp-toggle", "Invitation response", "Accept the quarter planning invite."),
]


if __name__ == "__main__":
    sys.exit(main(BEATS, AGENT_URL, record_dir=DEFAULT_RECORD_DIR, fixture_dir=FIXTURE_DIR))
