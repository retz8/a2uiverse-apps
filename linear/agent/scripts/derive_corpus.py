"""Derives the stub and deterministic corpora from a recorded live run.

One live run, three consumers (task-2.6 decision 11, task-7.3 decision 10): the captured MCP
payloads become the stub backend's fixtures; the settled painted streams of the three beats
become the deterministic agent's fixtures. Neither is hand-authored — that is what keeps the
canned data real-shaped. Nothing is pseudonymized (task-7.3 decision 11): the data is the user's
own workspace, and `tests/test_corpus_is_publishable.py` guards the result against anything
token- or secret-shaped.

    A2UI_RECORD_DIR=.recordings uv run python -m app --mode live --host localhost
    uv run python scripts/record_beats.py --model gemini-3.7-flash
    uv run python scripts/derive_corpus.py
"""

from __future__ import annotations

import json
from pathlib import Path

from a2ui_agent_kit.corpus import settled_messages

AGENT = Path(__file__).resolve().parent.parent
CAPTURED = AGENT / ".recordings" / "payloads"
BEATS = AGENT / "recordings" / "beats"
STUB = AGENT / "app" / "fixtures" / "stub"
DETERMINISTIC = AGENT / "app" / "fixtures" / "deterministic"

# Action name -> the beat whose settled stream answers it. Action responses are updates
# against a surface the client already holds, so they carry no createSurface.
ACTION_BEATS = {
    "open-issue.json": "beat-2-issue-detail.json",
    "confirm-change.json": "beat-3-status-confirm.json",
}


def captured(tool: str) -> list:
    path = CAPTURED / f"{tool}.jsonl"
    if not path.is_file():
        return []
    docs = []
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            docs.append(json.loads(line))
        except ValueError:
            continue
    return docs


def write(path: Path, payload: object, note: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{path.name:24} <- {note}")


def last(tool: str) -> object | None:
    docs = captured(tool)
    return docs[-1] if docs else None


def derive_stub() -> None:
    # The fullest issue list: the one the model read without narrowing it.
    lists = [d for d in captured("list_issues") if isinstance(d, dict)]
    if lists:
        fullest = max(lists, key=lambda d: len(d.get("issues") or []))
        write(STUB / "list-issues.json", fullest, f"{len(fullest.get('issues') or [])} issues")

    # One issue per identifier, the last read winning: it is the issue as the run left it.
    issues = {d["id"]: d for d in captured("get_issue") if isinstance(d, dict) and d.get("id")}
    if issues:
        write(STUB / "get-issue.json", issues, f"{len(issues)} issues")

    comments = {
        d["issueId"]: {k: v for k, v in d.items() if k != "issueId"}
        for d in captured("list_comments")
        if isinstance(d, dict) and d.get("issueId")
    }
    if comments:
        write(STUB / "comments.json", comments, f"{len(comments)} issues")

    for tool, fixture in (
        ("list_teams", "teams"),
        ("list_issue_statuses", "issue-statuses"),
        ("list_issue_labels", "issue-labels"),
        ("list_users", "users"),
        ("get_user", "user"),
    ):
        doc = last(tool)
        if doc is not None:
            write(STUB / f"{fixture}.json", doc, tool)


def derive_deterministic() -> None:
    # All or nothing: a partial corpus is worse than none, because the tests that depend on
    # it key on the directory existing and would run against a half-set.
    needed = ["beat-1-my-issues.json", *ACTION_BEATS.values()]
    missing = [name for name in needed if not (BEATS / name).is_file()]
    if missing:
        print(f"beats missing ({', '.join(missing)}) — skipping the deterministic corpus")
        return

    messages = settled_messages(BEATS / "beat-1-my-issues.json")
    write(DETERMINISTIC / "my-issues.json", messages, f"{len(messages)} messages")

    for fixture, beat in ACTION_BEATS.items():
        messages = [m for m in settled_messages(BEATS / beat) if "createSurface" not in m]
        write(DETERMINISTIC / fixture, messages, f"{len(messages)} messages")

    # Declining a proposal paints nothing new; the canned response says so on the surface.
    write(
        DETERMINISTIC / "decline-change.json",
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
                            "text": "Nothing was changed.",
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
