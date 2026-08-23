"""Stub read-only PR toolset: canned, real-shaped a2ui-project/a2ui data.

A minimal mirror of the GitHub read surface the demo beats need (a PR-list read and a
PR-detail read). 7.3 replaces these with the remote read-only MCP toolset; this stub
exists only so 7.2's definition of done — prompt -> tool call -> data-bound valid
surface — can be met before MCP. No write tool exists here (read-only invariant).
"""

from __future__ import annotations

import functools
import json
from pathlib import Path

_FIXTURES = Path(__file__).resolve().parent / "fixtures"


@functools.lru_cache(maxsize=1)
def _pr_list() -> list[dict]:
    return json.loads((_FIXTURES / "pr-list.json").read_text(encoding="utf-8"))


@functools.lru_cache(maxsize=1)
def _pr_detail() -> dict:
    return json.loads((_FIXTURES / "pr-detail.json").read_text(encoding="utf-8"))


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
