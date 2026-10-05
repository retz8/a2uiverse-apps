"""The CircleCI projects the signed-in person follows, asked of CircleCI's API with their
own token (task-12.10 decision 9).

CircleCI's hosted MCP server has no tool that lists projects, and `list_runs` — the entry
point of every pipeline question — needs one named. A project created through CircleCI's
GitHub App is found only by its id (its `gh/<org>/<repo>` slug does not resolve), so the
model cannot derive it from a repository name either. `list_projects` therefore asks
CircleCI's API for the projects the account follows and hands them to the model as data,
the way CircleCI's own UI shows a person the projects they follow.

A followed project's id is read from its address where CircleCI's GitHub App gave it one
(`//circleci.com/<organization id>/<project id>`), otherwise asked of the v2 API by its
slug.
"""

from __future__ import annotations

from typing import Any
from urllib.parse import urlsplit

import httpx
from a2ui_agent_kit.corpus import capture_payload, recording
from a2ui_agent_kit.sign_in import VendorSignInEnded, vendor_access_token

API = "https://circleci.com/api"

_VCS_SLUG = {"github": "gh", "bitbucket": "bb"}


def api_headers(access_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}


def _checked(response: httpx.Response) -> Any:
    if response.status_code == 401:
        raise VendorSignInEnded("CircleCI refused the token")
    response.raise_for_status()
    return response.json()


async def _project_id(project: dict[str, Any], http: httpx.AsyncClient) -> str | None:
    address = urlsplit(project.get("vcs_url") or "")
    parts = [p for p in address.path.split("/") if p]
    if address.netloc == "circleci.com" and len(parts) == 2:
        return parts[1]
    vcs = _VCS_SLUG.get(project.get("vcs_type") or "")
    if not vcs or not project.get("username") or not project.get("reponame"):
        return None
    slug = f"{vcs}/{project['username']}/{project['reponame']}"
    found = _checked(await http.get(f"{API}/v2/project/{slug}"))
    return found.get("id")


async def followed_projects(access_token: str, http: httpx.AsyncClient) -> list[dict[str, str]]:
    """Each project the account follows, by its repository name and its project id."""
    http.headers.update(api_headers(access_token))
    projects = []
    for project in _checked(await http.get(f"{API}/v1.1/projects")):
        project_id = await _project_id(project, http)
        if project_id:
            projects.append({"name": project.get("reponame") or project_id, "id": project_id})
    return projects


async def list_projects() -> dict:
    """Lists the CircleCI projects this user has, each with its repository name and id.

    Returns:
        An object with a `projects` list of {name, id}. A project's `id` is what
        `list_runs` takes as `project`.
    """
    async with httpx.AsyncClient(timeout=20) as http:
        result = {"projects": await followed_projects(vendor_access_token(), http)}
    if recording():
        capture_payload("list_projects", result)
    return result
