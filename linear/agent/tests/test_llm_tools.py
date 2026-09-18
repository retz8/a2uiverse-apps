"""The stub toolset mirrors the live inventory over the derived corpus; stub writes are inert."""

from __future__ import annotations

from app.mcp import LINEAR_TOOLS
from app.tools import (
    STUB_TOOLS,
    get_issue,
    get_user,
    list_comments,
    list_issue_labels,
    list_issue_statuses,
    list_issues,
    list_teams,
    save_comment,
    save_issue,
)


def test_the_stub_mirrors_the_live_inventory():
    assert {t.__name__ for t in STUB_TOOLS} == set(LINEAR_TOOLS)


def test_my_issues_resolve_through_the_corpus():
    mine = list_issues(assignee="me")["issues"]
    assert mine
    for issue in mine:
        assert issue["id"] and issue["status"] and issue["statusType"]
        assert issue["priority"]["name"]


def test_filters_narrow_the_list():
    started = list_issues(state="started")["issues"]
    assert started and all(i["statusType"] == "started" for i in started)
    assert list_issues(label="no-such-label")["issues"] == []


def test_an_opened_issue_carries_its_linked_pull_request_and_branch():
    issue = get_issue(_opened())
    assert issue["gitBranchName"]
    assert any("/pull/" in a["url"] for a in issue["attachments"])


def test_the_team_vocabulary_is_in_the_corpus():
    assert list_teams()["teams"]
    assert {s["type"] for s in list_issue_statuses("any")} >= {"backlog", "unstarted", "started", "completed"}
    assert list_issue_labels()["labels"]
    assert get_user("me")["email"]


def test_comments_are_served_per_issue():
    assert "comments" in list_comments(_opened())
    assert list_comments("NO-1") == {"comments": [], "hasNextPage": False}


def test_writes_are_acknowledged_and_inert():
    opened = _opened()
    before = get_issue(opened)
    after = save_issue(id=opened, state="Done", priority=1)
    assert after["status"] == "Done" and after["priority"]["name"] == "Urgent"
    assert get_issue(opened) == before
    assert save_issue(title="New", team="A2U")["id"]
    assert save_comment(opened, "noted")["body"] == "noted"


def test_unknown_ids_are_reported_not_raised():
    assert "error" in get_issue("NO-1")


def _opened() -> str:
    """An issue the beats opened: the corpus holds detail only for those."""
    from app.tools import _fixture

    return next(iter(_fixture("get-issue")))
