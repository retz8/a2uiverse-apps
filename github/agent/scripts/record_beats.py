"""Headless beat driver: runs the eight beats against a live agent and keeps the streams.

Task 8.1. The agent records what it streams (the kit recorder, armed by
A2UI_RECORD_DIR); the kit's driver (`a2uiverse_kit.beats`) supplies the mechanics —
this shim carries only what is GitHub's: the beats, the agent URL, and the
directories.

The agent must already be running. The model is an agent-startup concern (ADK builds the
LlmAgent once), so a beat that needs a different rung of the model ladder is driven in a
separate invocation against a separately-started agent:

    # default rung
    A2UI_RECORD_DIR=.recordings uv run python -m app --mode live --host localhost
    uv run python scripts/record_beats.py --beats 1,4,5,7,8 --model gemini-3.5-flash

    # stronger rung, for the beats-2/6 retry (phase spec decision 18)
    MODEL_NAME=gemini-3.1-pro-preview A2UI_RECORD_DIR=.recordings uv run python -m app --mode live ...
    uv run python scripts/record_beats.py --beats 2,6 --model gemini-3.1-pro-preview
"""

from __future__ import annotations

import sys
from pathlib import Path

from a2uiverse_kit.beats import Turn, main

AGENT_URL = "http://localhost:11001"
REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_RECORD_DIR = REPO_ROOT / ".recordings"
FIXTURE_DIR = REPO_ROOT / "recordings" / "beats"

BEATS: list[Turn] = [
    Turn(1, "pr-list", "PR list", "Show me the open pull requests on a2ui-project/a2ui that need review."),
    Turn(2, "pr-detail", "PR detail", "Open a2ui-project/a2ui#2123."),
    Turn(3, "review-compose", "Compose-and-confirm review",
         "Draft an approving review saying the spec doc looks reasonable.", chains=True),
    Turn(4, "issue-list", "Issue list, fuzzy intent",
         "Which issues on a2ui-project/a2ui look like they're stalled waiting on someone?"),
    Turn(5, "issue-detail", "Issue detail", "Open a2ui-project/a2ui issue #2124."),
    Turn(6, "repo-landing", "Repository landing", "Show me the a2ui-project/a2ui repository."),
    Turn(7, "user-profile", "User profile", "Who is gspencergoog and what do they work on?"),
    Turn(8, "notifications", "Viewer-centric, ambiguous scope", "What needs my attention today?"),
]


if __name__ == "__main__":
    sys.exit(main(BEATS, AGENT_URL, record_dir=DEFAULT_RECORD_DIR, fixture_dir=FIXTURE_DIR))
