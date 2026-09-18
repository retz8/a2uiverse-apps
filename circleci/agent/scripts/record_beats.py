"""Headless beat driver: runs the four beats against the live agent and keeps the streams.

The agent records what it streams (the kit recorder, armed by A2UI_RECORD_DIR); the kit's
driver (`a2ui_agent_kit.beats`) supplies the mechanics — this shim carries only what is
CircleCI's: the beats, the agent URL, and the directories.

The agent must already be running, armed:

    A2UI_RECORD_DIR=.recordings uv run python -m app --mode live --host localhost
    uv run python scripts/record_beats.py --model gemini-3.7-flash

Beat 3 needs a failed run in the configured project, and beat 4 really reruns that run's
workflow on CircleCI — it is the rerun the beat records.
"""

from __future__ import annotations

import sys
from pathlib import Path

from a2ui_agent_kit.beats import Turn, main

AGENT_URL = "http://localhost:11004"
REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_RECORD_DIR = REPO_ROOT / ".recordings"
FIXTURE_DIR = REPO_ROOT / "recordings" / "beats"

# The four beats (task-7.2 decision 10): the recent runs, one run opened, a failed job's
# logs, and a rerun proposed then confirmed. Beats 2-4 chain onto beat 1's conversation, so
# each acts on the run the previous turn actually painted. Beat 4 is two turns, the proposal
# and its confirm, kept as two fixtures under one beat number. The kit retries a chain as a
# whole, so a retried run reruns the workflow again on CircleCI.
BEATS: list[Turn] = [
    Turn(1, "recent-runs", "Recent runs",
         "How are my recent CircleCI pipeline runs doing? Show each run's branch, commit, "
         "outcome and its workflows."),
    Turn(2, "run-detail", "Run detail",
         "Open the most recent failed run.", chains=True),
    Turn(3, "job-failure", "Failed job logs",
         "Why did it fail? Show me the failed job's step and the end of its log.", chains=True),
    Turn(4, "rerun-proposal", "Rerun proposed",
         "Rerun only the failed jobs of that workflow.", chains=True),
    Turn(4, "rerun-confirm", "Rerun confirmed",
         "Yes, rerun it.", chains=True),
]


if __name__ == "__main__":
    sys.exit(main(BEATS, AGENT_URL, record_dir=DEFAULT_RECORD_DIR, fixture_dir=FIXTURE_DIR))
