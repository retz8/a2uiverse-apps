"""Stub PR toolset: canned, real-shaped a2ui-project/a2ui data.

A minimal mirror of the GitHub surface the demo beats need: a PR-list read, a PR-detail
read, and one write, submitting a review. The live agent holds the full MCP surface,
writes included. The stub's write writes nothing: it answers as GitHub does, and it
needs `github.write` (`app/sign_in.py`), so a stub run reaches the request for more
access as a live write does.
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


# GitHub's review events, and the state each leaves the review in.
_REVIEW_STATES = {
    "APPROVE": "APPROVED",
    "REQUEST_CHANGES": "CHANGES_REQUESTED",
    "COMMENT": "COMMENTED",
}


def submit_pull_request_review(number: int, event: str, body: str = "") -> dict:
    """Submits a review on a pull request on a2ui-project/a2ui, under the person's name.

    Args:
        number: The pull-request number.
        event: The review's verdict: "APPROVE", "REQUEST_CHANGES", or "COMMENT".
        body: The review's text. Optional when approving.

    Returns:
        The submitted review (number, state, body). Returns an object with an "error"
        key if the number or the event is unknown.
    """
    if str(number) not in _pr_detail():
        return {"error": f"pull request #{number} not found"}
    state = _REVIEW_STATES.get(event)
    if state is None:
        return {"error": f"unknown review event {event!r}: APPROVE, REQUEST_CHANGES or COMMENT"}
    return {"number": number, "state": state, "body": body}


STUB_TOOLS = [list_pull_requests, get_pull_request, submit_pull_request_review]
