"""No tracked artifact may carry real mailbox content.

This is a build-time guard, not a style check. The repositories are public, the mailbox is
real, and task-2.6 decision 8 rests on pseudonymization happening at the source. A guard
that only exists inside the pseudonymizer is a guard that fails silently the moment a
payload arrives in a shape the pseudonymizer does not recognise — which is exactly what
happened on the first live recording run: the captured corpus was clean while the painted
stream carried a real address, so the substitution had run on a copy the model never saw.

So the invariant is asserted where it actually matters — over the files that would be
pushed — rather than trusted to the code that is supposed to maintain it.
"""

from __future__ import annotations

import re
from pathlib import Path

AGENT = Path(__file__).resolve().parents[1]

# Directories whose contents are committed and therefore published.
TRACKED_CORPORA = (
    AGENT / "app" / "fixtures" / "stub",
    AGENT / "app" / "fixtures" / "deterministic",
    AGENT / "recordings",
    AGENT / "app" / "knowledge" / "examples",
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
        "tracked artifacts carry addresses outside the reserved example domains — the "
        "pseudonymizer did not cover this payload shape. Do not push; re-record after "
        "fixing the substitution boundary.\n  " + "\n  ".join(sorted(offenders))
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
