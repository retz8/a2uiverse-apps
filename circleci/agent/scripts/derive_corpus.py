"""Derives the stub and deterministic corpora from a recorded live run.

One live run, three consumers (task-2.6 decision 11, task-7.2 decision 10): the captured MCP
payloads become the stub backend's fixtures; the settled painted streams of the four beats
become the deterministic agent's fixtures. Neither is hand-authored — that is what keeps the
canned data real-shaped. Nothing is pseudonymized (task-7.2 decision 11): the data is a public
repository's CI, and `tests/test_corpus_is_publishable.py` guards the result against anything
token- or secret-shaped.

    A2UI_RECORD_DIR=.recordings uv run python -m app --mode live --host localhost
    uv run python scripts/record_beats.py --model gemini-3.7-flash
    uv run python scripts/derive_corpus.py
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

from a2ui_agent_kit.corpus import settled_messages

AGENT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(AGENT))

from app.projects import configured_projects  # noqa: E402

CAPTURED = AGENT / ".recordings" / "payloads"
BEATS = AGENT / "recordings" / "beats"
STUB = AGENT / "app" / "fixtures" / "stub"
DETERMINISTIC = AGENT / "app" / "fixtures" / "deterministic"

# Action name -> the beat whose settled stream answers it. Action responses are updates
# against a surface the client already holds, so they carry no createSurface.
ACTION_BEATS = {
    "open-run.json": "beat-2-run-detail.json",
    "open-job.json": "beat-3-job-failure.json",
    "rerun-workflow.json": "beat-4-rerun-proposal.json",
    "confirm-rerun.json": "beat-4-rerun-confirm.json",
}


def captured(tool: str) -> list[dict]:
    path = CAPTURED / f"{tool}.jsonl"
    if not path.is_file():
        return []
    docs = []
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            doc = json.loads(line)
        except ValueError:
            continue
        if isinstance(doc, dict):
            docs.append(doc)
    return docs


def write(path: Path, payload: object, note: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"{path.name:24} <- {note}")


def keyed(docs: list[dict], items: str, ref: str) -> dict[str, dict]:
    """Indexes list payloads by the parent id each item references (last capture wins)."""
    index: dict[str, dict] = {}
    for doc in docs:
        for item in doc.get(items) or []:
            parent = (item.get("references") or {}).get(ref, {}).get("id")
            if parent:
                index[parent] = doc
                break
    return index


def derive_stub() -> None:
    load_dotenv(AGENT / ".env")
    if os.environ.get("CIRCLECI_PROJECTS"):
        projects = configured_projects()
        write(STUB / "projects.json", {"projects": projects}, f"{len(projects)} projects")

    runs = max(captured("list_runs"), key=lambda d: len(d.get("runs") or []), default=None)
    if runs:
        write(STUB / "list-runs.json", runs, f"{len(runs['runs'])} runs")

    workflows = keyed(captured("list_run_workflows"), "workflows", "run")
    if workflows:
        write(STUB / "run-workflows.json", workflows, f"{len(workflows)} runs")

    jobs = keyed(captured("list_workflow_jobs"), "jobs", "workflow")
    if jobs:
        write(STUB / "workflow-jobs.json", jobs, f"{len(jobs)} workflows")

    job_docs = {doc["id"]: doc for doc in captured("get_job") if doc.get("id")}
    if job_docs:
        write(STUB / "get-job.json", job_docs, f"{len(job_docs)} jobs")

    logs = {doc["job"]: doc for doc in captured("get_job_logs") if doc.get("job")}
    if logs:
        write(STUB / "job-logs.json", logs, f"{len(logs)} jobs")


def derive_deterministic() -> None:
    # All or nothing: a partial corpus is worse than none, because the tests that depend on
    # it key on the directory existing and would run against a half-set.
    needed = ["beat-1-recent-runs.json", *ACTION_BEATS.values()]
    missing = [name for name in needed if not (BEATS / name).is_file()]
    if missing:
        print(f"beats missing ({', '.join(missing)}) — skipping the deterministic corpus")
        return

    messages = settled_messages(BEATS / "beat-1-recent-runs.json")
    write(DETERMINISTIC / "recent-runs.json", messages, f"{len(messages)} messages")

    for fixture, beat in ACTION_BEATS.items():
        messages = [m for m in settled_messages(BEATS / beat) if "createSurface" not in m]
        write(DETERMINISTIC / fixture, messages, f"{len(messages)} messages")

    # Declining a proposal paints nothing new; the canned response says so on the surface.
    write(
        DETERMINISTIC / "decline-rerun.json",
        [
            {
                "version": "v0.9",
                "updateComponents": {
                    "components": [
                        {"id": "root", "component": "Card", "child": "declined"},
                        {
                            "id": "declined",
                            "component": "Text",
                            "variant": "body",
                            "text": "Nothing was rerun.",
                        },
                    ]
                },
            }
        ],
        "authored (a decline paints no new data)",
    )


if __name__ == "__main__":
    if not CAPTURED.is_dir():
        raise SystemExit(
            f"no captured payloads at {CAPTURED}. Record a run first — see agent/README.md."
        )
    derive_stub()
    derive_deterministic()
    print("\nNow run: uv run pytest tests/test_corpus_is_publishable.py")
