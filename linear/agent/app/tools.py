"""Stub Linear toolset: canned, real-shaped issue data for `--mode stub`.

A mirror of the live inventory (`app/mcp.py` `LINEAR_TOOLS`) over fixtures derived from a
recorded live run (`scripts/derive_corpus.py`), so the canned data carries the server's real
shapes rather than invented ones. Each tool returns what the server's result carries.

The stub exists so prompt iteration and client work need not touch Linear. It is always an
explicit opt-in (`--mode stub`). Writes are accepted and acknowledged but change nothing: a stub
save returns the issue as the fixture holds it, with the saved fields laid over it.
"""

from __future__ import annotations

from pathlib import Path

from a2ui_agent_kit.responses import stub_fixture_loader

_FIXTURES = Path(__file__).resolve().parent / "fixtures" / "stub"

_fixture = stub_fixture_loader(
    _FIXTURES,
    hint=(
        "The stub corpus is derived from a live MCP run with the recorder armed; "
        "see agent/README.md."
    ),
)

_PRIORITY = {0: "No priority", 1: "Urgent", 2: "High", 3: "Medium", 4: "Low"}


def _issues() -> list[dict]:
    return list(_fixture("list-issues").get("issues") or [])


def _matches(value: str, *candidates: object) -> bool:
    wanted = value.strip().lower()
    return any(isinstance(c, str) and c.strip().lower() == wanted for c in candidates)


def list_issues(
    assignee: str = "",
    team: str = "",
    state: str = "",
    label: str = "",
    priority: int | None = None,
    query: str = "",
    limit: int = 50,
) -> dict:
    """Lists issues in the user's Linear workspace, most recently updated first.

    Args:
        assignee: A user's name or email, or "me" for the user's own issues.
        team: A team's name or id.
        state: A workflow state's name or type, e.g. "In Progress" or "started".
        label: A label's name.
        priority: 0 none, 1 urgent, 2 high, 3 medium, 4 low.
        query: Text to find in an issue's title or description.
        limit: Maximum number of issues. Defaults to 50.

    Returns:
        An object with an `issues` list; each carries its identifier (`id`), title, status and
        statusType, priority {value, name}, labels, assignee, gitBranchName and url.
    """
    me = _fixture("user")
    issues = _issues()
    if assignee:
        names = (me.get("name"), me.get("email"), me.get("displayName")) if assignee == "me" else (assignee,)
        issues = [i for i in issues if any(_matches(str(n), i.get("assignee")) for n in names if n)]
    if team:
        issues = [i for i in issues if _matches(team, i.get("team"), i.get("teamId"))]
    if state:
        issues = [i for i in issues if _matches(state, i.get("status"), i.get("statusType"))]
    if label:
        issues = [i for i in issues if any(_matches(label, name) for name in i.get("labels") or [])]
    if priority is not None:
        issues = [i for i in issues if (i.get("priority") or {}).get("value") == priority]
    if query:
        needle = query.lower()
        issues = [
            i for i in issues
            if needle in (i.get("title") or "").lower() or needle in (i.get("description") or "").lower()
        ]
    return {"issues": issues[:limit], "hasNextPage": False}


def get_issue(id: str) -> dict:
    """Fetches one issue by its identifier, with its attachments and state history.

    Args:
        id: The issue's identifier, e.g. "ENG-123".

    Returns:
        The issue: everything list_issues carries, its whole description, its `attachments`
        (each {id, title, url} — linked pull requests among them) and its `stateHistory`.
    """
    found = _fixture("get-issue").get(id.upper())
    return found if found is not None else {"error": f"issue {id} not found"}


def list_comments(issueId: str) -> dict:
    """Lists the comments on one issue.

    Args:
        issueId: The issue's identifier.

    Returns:
        An object with a `comments` list; each carries its body, author and createdAt.
    """
    return _fixture("comments").get(issueId.upper(), {"comments": [], "hasNextPage": False})


def list_teams() -> dict:
    """Lists the teams in the user's workspace.

    Returns:
        An object with a `teams` list of {id, name}.
    """
    return _fixture("teams")


def list_issue_statuses(team: str) -> list:
    """Lists a team's workflow states.

    Args:
        team: The team's name or id.

    Returns:
        A list of {id, name, type}.
    """
    return _fixture("issue-statuses")


def list_issue_labels(team: str = "") -> dict:
    """Lists the issue labels available to a team.

    Args:
        team: The team's name or id.

    Returns:
        An object with a `labels` list of {id, name, color}.
    """
    return _fixture("issue-labels")


def list_users(query: str = "") -> dict:
    """Lists the users in the workspace.

    Args:
        query: Filter by name or email.

    Returns:
        An object with a `users` list.
    """
    users = _fixture("users")
    if not query:
        return users
    needle = query.lower()
    return {
        **users,
        "users": [
            u for u in users.get("users") or []
            if needle in (u.get("name") or "").lower() or needle in (u.get("email") or "").lower()
        ],
    }


def get_user(query: str) -> dict:
    """Fetches one user; "me" is the authenticated user.

    Args:
        query: A user's id, name or email, or "me".

    Returns:
        The user: id, name, email, displayName and teams.
    """
    return _fixture("user")


def save_issue(
    id: str = "",
    title: str = "",
    team: str = "",
    description: str = "",
    state: str = "",
    priority: int | None = None,
    assignee: str = "",
    addLabels: list[str] | None = None,
    removeLabels: list[str] | None = None,
) -> dict:
    """Creates an issue, or updates the one `id` names. In the stub backend nothing is saved.

    Args:
        id: The issue to update. Omit to create one.
        title: The title. Required when creating.
        team: The team to create the issue in. Required when creating.
        description: The description, in Markdown.
        state: The workflow state's name or type.
        priority: 0 none, 1 urgent, 2 high, 3 medium, 4 low.
        assignee: A user's name or email, or "me".
        addLabels: Label names to add.
        removeLabels: Label names to remove.

    Returns:
        The issue as it would stand after the save.
    """
    base = get_issue(id) if id else {"id": "NEW-0", "title": title, "team": team, "labels": []}
    if "error" in base:
        return base
    issue = dict(base)
    if title:
        issue["title"] = title
    if description:
        issue["description"] = description
    if state:
        issue["status"] = state
    if priority is not None:
        issue["priority"] = {"value": priority, "name": _PRIORITY.get(priority, "No priority")}
    if assignee:
        issue["assignee"] = assignee
    labels = [l for l in issue.get("labels") or [] if l not in (removeLabels or [])]
    issue["labels"] = labels + [l for l in addLabels or [] if l not in labels]
    return issue


def save_comment(issueId: str, body: str) -> dict:
    """Adds a comment to an issue. In the stub backend nothing is posted.

    Args:
        issueId: The issue's identifier.
        body: The comment, in Markdown.

    Returns:
        The comment: its id, body and the issue it was left on.
    """
    return {"id": "00000000-0000-4000-8000-000000000000", "body": body, "issueId": issueId}


STUB_TOOLS = [
    list_issues,
    get_issue,
    list_comments,
    list_teams,
    list_issue_statuses,
    list_issue_labels,
    list_users,
    get_user,
    save_issue,
    save_comment,
]
