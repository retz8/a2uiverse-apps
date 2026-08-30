"""No tracked artifact may carry a real address.

A build-time guard, not a style check, and deliberately kept even though task-2.7 decision 4
makes a leak structurally unlikely: the agent reads a seeded demo calendar whose contents are
authored, so unlike Gmail there is no real content flowing through to be missed.

What it still catches is the one real identifier such a run CAN carry — the authenticated
account's own address, which appears on every event the seed marks the viewer as attending.
`scripts/derive_corpus.mask_self` replaces it; this asserts that it did, over the files that
would actually be pushed rather than trusting the code that is supposed to maintain it.

Gmail learned the general lesson the hard way: a guarantee enforced only inside the code that
produces an artifact fails silently the moment the artifact arrives in an unanticipated shape.
The guarantee belongs on the artifact.
"""

from __future__ import annotations

import re
from pathlib import Path

AGENT = Path(__file__).resolve().parents[1]

# Directories whose contents are committed and therefore published.
TRACKED_CORPORA = (
    AGENT / "llm_agent" / "fixtures",
    AGENT / "deterministic_agent" / "fixtures",
    AGENT / "recordings",
    AGENT / "knowledge" / "examples",
    # The seed corpus is authored and tracked, and it is nothing but names and addresses —
    # so it is exactly the file a careless edit would put a real colleague into.
    AGENT / "scripts",
)

_ADDRESS = re.compile(r"[\w.+-]+@[\w.-]+\.[a-z]{2,}", re.IGNORECASE)

# The only address domains a published artifact may contain. RFC 2606 reserves these
# precisely so they cannot belong to anyone.
ALLOWED_DOMAINS = ("example.com", "example.org", "example.net", "corp.invalid")


def _tracked_files() -> list[Path]:
    files: list[Path] = []
    for directory in TRACKED_CORPORA:
        if directory.is_dir():
            files.extend(p for p in directory.rglob("*.json") if p.is_file())
    return files


def test_no_tracked_artifact_carries_a_real_address():
    offenders: list[str] = []
    for path in _tracked_files():
        for address in set(_ADDRESS.findall(path.read_text(encoding="utf-8"))):
            if not address.lower().endswith(ALLOWED_DOMAINS):
                offenders.append(f"{path.relative_to(AGENT)}: {address}")
    assert not offenders, (
        "tracked artifacts carry addresses outside the reserved example domains. Either the "
        "seed corpus names a real person, or a capture kept the account's own address and "
        "derive_corpus did not mask it. Do not push.\n  " + "\n  ".join(sorted(offenders))
    )


def test_the_guard_would_catch_a_leak(tmp_path):
    # A guard nobody has seen fail is a guard nobody knows works.
    leaky = tmp_path / "leaky.json"
    leaky.write_text('{"sender": "someone@a-real-company.com"}', encoding="utf-8")
    found = [
        a
        for a in _ADDRESS.findall(leaky.read_text(encoding="utf-8"))
        if not a.lower().endswith(ALLOWED_DOMAINS)
    ]
    assert found == ["someone@a-real-company.com"]
