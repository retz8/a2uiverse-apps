"""The CircleCI projects this user has, as configured in `agent/.env`.

CircleCI's hosted MCP server has no tool that lists projects, and `list_runs` — the entry
point of every pipeline question — needs one named. A project created through CircleCI's
GitHub App is found only by its id (its `gh/<org>/<repo>` slug does not resolve), so the
model cannot derive it from a repository name either. The list is therefore configuration:
`CIRCLECI_PROJECTS` names each project by repository and id, and `list_projects` hands it to
the model as data, the way CircleCI's own UI shows a user the projects they follow.

    CIRCLECI_PROJECTS=a2uiverse=5475943e-db5e-4b4a-937b-4d64f8f05d3c,other-repo=<id>
"""

from __future__ import annotations

import os

PROJECTS_ENV = "CIRCLECI_PROJECTS"


class ProjectsNotConfiguredError(RuntimeError):
    """Raised by `--mode live` when no project is configured."""


def parse_projects(raw: str) -> list[dict[str, str]]:
    """Parses `name=id` pairs, comma-separated. Malformed entries are an error, not skipped."""
    projects = []
    for entry in (part.strip() for part in raw.split(",")):
        if not entry:
            continue
        name, sep, project_id = entry.partition("=")
        if not sep or not name.strip() or not project_id.strip():
            raise ProjectsNotConfiguredError(
                f"{PROJECTS_ENV} entry {entry!r} is not `name=id`. Each project is its "
                "repository name and its CircleCI project id, e.g. "
                "`a2uiverse=5475943e-db5e-4b4a-937b-4d64f8f05d3c`."
            )
        projects.append({"name": name.strip(), "id": project_id.strip()})
    return projects


def configured_projects() -> list[dict[str, str]]:
    """The configured projects, failing fast when there are none.

    An agent with no project could only answer every pipeline question with an error, so
    the live mode refuses to start rather than paint that.
    """
    projects = parse_projects(os.environ.get(PROJECTS_ENV, ""))
    if not projects:
        raise ProjectsNotConfiguredError(
            f"{PROJECTS_ENV} is not set. The live agent needs the CircleCI projects it "
            "covers, each as `name=id` in agent/.env — the id is the project's UUID, shown "
            "in its CircleCI project settings. To run against canned fixture data instead, "
            "run with --mode stub."
        )
    return projects


def list_projects() -> dict:
    """Lists the CircleCI projects this user has, each with its repository name and id.

    Returns:
        An object with a `projects` list of {name, id}. A project's `id` is what
        `list_runs` takes as `project`.
    """
    return {"projects": configured_projects()}
