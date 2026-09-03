"""Stub PR toolset: canned, real-shaped a2ui-project/a2ui data.

A minimal mirror of the GitHub read surface the demo beats need (a PR-list read and a
PR-detail read). The live agent holds the full MCP surface, writes included; the stub
stays a read-only pair deliberately (task-3.7 decision 4) — writes are exercised live
only, and stub/deterministic modes keep their read-only behavior.
"""

from __future__ import annotations

from pathlib import Path

from a2ui_agent_kit.responses import stub_fixture_loader

_FIXTURES = Path(__file__).resolve().parent / "fixtures" / "stub"

_fixture = stub_fixture_loader(
    _FIXTURES,
    hint="The stub corpus is checked in with the app; see agent/README.md.",
)


def _pr_list() -> list[dict]:
    return _fixture("pr-list")


def _pr_detail() -> dict:
    return _fixture("pr-detail")


def list_pull_requests(state: str = "open") -> list[dict]:
    """Lists pull requests on a2ui-project/a2ui.

    Args:
        state: Filter by PR state: "open", "closed", or "all". Defaults to "open".

    Returns:
        A list of pull-request summaries (number, title, state, author, labels,
        review/comment counts).
    """
    prs = _pr_list()
    if state and state != "all":
        return [pr for pr in prs if pr.get("state") == state]
    return list(prs)


def get_pull_request(number: int) -> dict:
    """Gets one pull request on a2ui-project/a2ui by number.

    Args:
        number: The pull-request number.

    Returns:
        The pull-request detail (body, head/base refs, additions/deletions,
        changed_files, mergeable state, labels, reviewers). Returns an object with
        an "error" key if the number is unknown.
    """
    detail = _pr_detail().get(str(number))
    if detail is None:
        return {"error": f"pull request #{number} not found"}
    return detail


STUB_TOOLS = [list_pull_requests, get_pull_request]
