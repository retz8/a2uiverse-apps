"""No tracked artifact may carry a credential (task-7.3 decision 11).

The recorded corpus keeps its real values — the data is the user's own Linear workspace — so
the guard is not about people but about secrets: a token that leaked into a payload, a log line
or a painted stream would be pushed to a public repository. It is asserted over the files
that would be pushed, not trusted to the code that captured them.
"""

from __future__ import annotations

import os
import re
from pathlib import Path

from dotenv import dotenv_values

from app.mcp import PLACEHOLDER_EMAIL

AGENT = Path(__file__).resolve().parents[1]

# Directories whose contents are committed and therefore published.
TRACKED_CORPORA = (
    AGENT / "app" / "fixtures" / "stub",
    AGENT / "app" / "fixtures" / "deterministic",
    AGENT / "recordings",
    AGENT / "app" / "knowledge" / "examples",
)

# Token shapes that must never be published: Linear API keys and OAuth tokens, CircleCI
# personal tokens, GitHub tokens, Google API keys, Slack tokens, and any bearer credential
# written out.
SECRET_SHAPES = re.compile(
    r"lin_(?:api|oauth)_[A-Za-z0-9]{16,}"
    r"|CCIPAT_[A-Za-z0-9_]+"
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
    for key in ("LINEAR_MCP_TOKEN", "GOOGLE_API_KEY")
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


# Any email address. The recorder replaces the key's own address with the placeholder (task-7.3
# decision 11), so a recorded corpus may hold the placeholder and Linear's own system addresses —
# its built-in app user, `linear-<workspace id>@linear.linear.app`, which `list_users` returns
# beside the people. Any other address is either the key's own, escaped, or a person's, and
# neither is published unexamined.
EMAIL_SHAPE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
LINEAR_SYSTEM_DOMAIN = "@linear.linear.app"


def _addresses(text: str) -> list[str]:
    return [
        a
        for a in EMAIL_SHAPE.findall(text)
        if a.lower() != PLACEHOLDER_EMAIL and not a.lower().endswith(LINEAR_SYSTEM_DOMAIN)
    ]


def test_no_tracked_artifact_carries_an_email_address():
    offenders = sorted(
        {
            f"{path.relative_to(AGENT)}: {address}"
            for path in _tracked_files()
            for address in _addresses(path.read_text(encoding="utf-8"))
        }
    )
    assert not offenders, (
        "tracked artifacts carry an email address other than the placeholder. Re-record with "
        "the recorder armed (it replaces the key's own address); an address that is not the "
        "key's is a decision to make before publishing.\n  " + "\n  ".join(offenders)
    )


def test_the_guard_would_catch_a_leak():
    # A guard nobody has seen fail is a guard nobody knows works.
    assert _leaks('{"note": "LINEAR_MCP_TOKEN=lin_api_AbCdEf0123456789XyZ"}')
    assert _leaks('{"h": "Authorization: Bearer abcdefghijklmnopqrstu"}')
    assert not _leaks('{"gitBranchName": "ekkicb71/a2u-5-tighten-the-sort-comparator"}')
    assert _addresses('{"assignee": "someone@example.org"}')
    assert not _addresses(f'{{"email": "{PLACEHOLDER_EMAIL}"}}')
    assert not _addresses('{"email": "linear-ee2c649c@linear.linear.app"}')
    assert _addresses('{"email": "someone@linear.app"}')
