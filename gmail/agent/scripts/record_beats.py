"""Headless beat driver: runs the four beats against a live agent and keeps the streams.

Task 8.1. The agent records what it streams (the kit recorder, armed by
A2UI_RECORD_DIR); the kit's driver (`a2ui_agent_kit.beats`) supplies the mechanics —
this shim carries only what is Gmail's: the beats, the agent URL, and the directories.

The agent must already be running. The model is an agent-startup concern (ADK builds the
LlmAgent once), so a beat that needs a different rung of the model ladder is driven in a
separate invocation against a separately-started agent:

    # default rung
    A2UI_RECORD_DIR=.recordings uv run python -m app --mode live --host localhost
    uv run python scripts/record_beats.py --beats 1,4 --model gemini-3.5-flash

    # stronger rung, for a retry (phase spec decision 18)
    MODEL_NAME=gemini-3.1-pro-preview A2UI_RECORD_DIR=.recordings uv run python -m app --mode live ...
    uv run python scripts/record_beats.py --beats 2,3 --model gemini-3.1-pro-preview
"""

from __future__ import annotations

import sys
from pathlib import Path

from a2ui_agent_kit.beats import Turn, main

AGENT_URL = "http://localhost:11002"
REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_RECORD_DIR = REPO_ROOT / ".recordings"
FIXTURE_DIR = REPO_ROOT / "recordings" / "beats"

# The four beats (task-2.6 decision 9), one per kind of surface: list, detail, creating
# write, toggling write. Beats 2 and 3 chain onto beat 1s conversation, so a reply is
# drafted against a thread the run actually opened.
BEATS: list[Turn] = [
    Turn(1, "inbox-digest", "Inbox digest", "What needs my attention today?"),
    Turn(2, "thread-detail", "Thread detail", "Open the most recent one of those.", chains=True),
    Turn(3, "reply-compose", "Compose-and-confirm reply",
         "Draft a short reply saying I will get to it this week.", chains=True),
    Turn(4, "label-toggle", "Label toggle", "What labels do I have?"),
]


if __name__ == "__main__":
    sys.exit(main(BEATS, AGENT_URL, record_dir=DEFAULT_RECORD_DIR, fixture_dir=FIXTURE_DIR))
