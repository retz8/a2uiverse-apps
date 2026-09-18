"""No tracked artifact may carry a credential (task-7.2 decision 11).

The recorded corpus keeps its real values — the data is a public repository's CI — so the
guard is not about people but about secrets: a token that leaked into a payload, a log line
or a painted stream would be pushed to a public repository. It is asserted over the files
that would be pushed, not trusted to the code that captured them.
"""

from __future__ import annotations

import os
import re
from pathlib import Path

from dotenv import dotenv_values

AGENT = Path(__file__).resolve().parents[1]

# Directories whose contents are committed and therefore published.
TRACKED_CORPORA = (
    AGENT / "app" / "fixtures" / "stub",
    AGENT / "app" / "fixtures" / "deterministic",
    AGENT / "recordings",
    AGENT / "app" / "knowledge" / "examples",
)

# Token shapes that must never be published: CircleCI personal tokens, GitHub tokens, Google
# API keys, Slack tokens, and any bearer credential written out.
SECRET_SHAPES = re.compile(
    r"CCIPAT_[A-Za-z0-9_]+"
    r"|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}"
    r"|AIza[0-9A-Za-z_-]{35}"
    r"|xox[abposr]-[A-Za-z0-9-]{10,}"
    r"|Bearer\s+[A-Za-z0-9._~+/-]{16,}"
)

# The live values themselves, when this machine has them: a leak of an unknown shape is
# still a leak of the configured secret.
_ENV = {**dotenv_values(AGENT / ".env"), **os.environ}
LIVE_SECRETS = [
    value
    for key in ("CIRCLECI_MCP_TOKEN", "GOOGLE_API_KEY")
    if (value := _ENV.get(key)) and len(value) >= 16 and "your-" not in value
]


def _tracked_files() -> list[Path]:
    files: list[Path] = []
    for directory in TRACKED_CORPORA:
        if directory.is_dir():
            files.extend(p for p in directory.rglob("*.json") if p.is_file())
    return files


def _leaks(text: str) -> list[str]:
    found = SECRET_SHAPES.findall(text)
    found += [f"<{len(s)}-char live secret>" for s in LIVE_SECRETS if s in text]
    return found


def test_no_tracked_artifact_carries_a_secret():
    offenders = [
        f"{path.relative_to(AGENT)}: {leak[:12]}…"
        for path in _tracked_files()
        for leak in _leaks(path.read_text(encoding="utf-8"))
    ]
    assert not offenders, (
        "tracked artifacts carry something token-shaped. Do not push; find where it entered "
        "the recording and re-record.\n  " + "\n  ".join(sorted(offenders))
    )


def test_the_guard_would_catch_a_leak():
    # A guard nobody has seen fail is a guard nobody knows works.
    assert _leaks('{"log": "export CIRCLE_TOKEN=CCIPAT_AbCdEf123_456"}')
    assert _leaks('{"h": "Authorization: Bearer abcdefghijklmnopqrstu"}')
    assert not _leaks('{"revision": "6b59996d37104d169e87d845c98bd039f38b1ae2"}')
