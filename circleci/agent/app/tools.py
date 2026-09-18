"""Stub CircleCI toolset: canned, real-shaped pipeline data for `--mode stub`.

A mirror of the live inventory (`app/mcp.py` `CIRCLECI_TOOLS`, plus `list_projects`) over
fixtures derived from a recorded live run (`scripts/derive_corpus.py`), so the canned data
carries the server's real shapes rather than invented ones. Each tool returns what the
server's structured result carries.

The stub exists so prompt iteration and client work need not touch CircleCI or spend its
call allowance. It is always an explicit opt-in (`--mode stub`). Writes are accepted and
acknowledged but change nothing: a stub rerun returns a workflow id without a workflow
existing.
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


def _by_id(fixture: str, key: str, what: str) -> dict:
    found = _fixture(fixture).get(key)
    if found is None:
        return {"error": f"{what} {key} not found"}
    return found


def list_projects() -> dict:
    """Lists the CircleCI projects this user has, each with its repository name and id.

    Returns:
        An object with a `projects` list of {name, id}. A project's `id` is what
        `list_runs` takes as `project`.
    """
    return _fixture("projects")


def list_runs(
    project: str = "", mine: bool = False, branch: str = "", status: str = "", limit: int = 10
) -> dict:
    """Lists a project's pipeline runs, newest first.

    Args:
        project: The project's id, from list_projects. Required unless mine is true.
        mine: List the runs the user triggered across all projects instead.
        branch: Only runs on this git branch. Ignored when mine is true.
        status: Only runs with this status, e.g. "success", "failed", "running".
        limit: Maximum number of runs to return. Defaults to 10.

    Returns:
        An object with a `runs` list; each run carries its id, `attributes` (phase,
        current_outcome, created_at, errors) and `references.event.attributes.vcs` (branch,
        revision, commit subject and author).
    """
    runs = _fixture("list-runs").get("runs") or []
    if project and not mine:
        runs = [r for r in runs if r["references"]["project"]["id"] == project]
    if branch and not mine:
        runs = [r for r in runs if r["references"]["event"]["attributes"]["vcs"]["branch"] == branch]
    if status:
        wanted = {"success": "succeeded", "failed": "failed", "canceled": "canceled"}.get(status)
        if status == "running":
            runs = [r for r in runs if r["attributes"].get("phase") != "ended"]
        elif wanted:
            runs = [r for r in runs if r["attributes"].get("current_outcome") == wanted]
    return {"runs": runs[:limit]}


def get_run(run: str) -> dict:
    """Fetches one run by its id.

    Args:
        run: The run id, from list_runs.

    Returns:
        The run: its phase, outcome, VCS details and any config errors.
    """
    for candidate in _fixture("list-runs").get("runs") or []:
        if candidate["id"] == run:
            return candidate
    return {"error": f"run {run} not found"}


def list_run_workflows(run: str) -> dict:
    """Lists the workflows of one run.

    Args:
        run: The run id, from list_runs or get_run.

    Returns:
        An object with a `workflows` list; each carries its id and `attributes` (name, phase,
        outcome, created_at, ended_at).
    """
    return _by_id("run-workflows", run, "run")


def get_workflow(workflow: str) -> dict:
    """Fetches one workflow by its id.

    Args:
        workflow: The workflow id, from list_run_workflows.

    Returns:
        The workflow: its name, phase and outcome.
    """
    for payload in _fixture("run-workflows").values():
        for candidate in payload.get("workflows") or []:
            if candidate["id"] == workflow:
                return candidate
    return {"error": f"workflow {workflow} not found"}


def list_workflow_jobs(workflow: str) -> dict:
    """Lists the jobs of one workflow.

    Args:
        workflow: The workflow id, from list_run_workflows or get_workflow.

    Returns:
        An object with a `jobs` list; each carries its id and `attributes` (name, phase,
        outcome, started_at, ended_at).
    """
    return _by_id("workflow-jobs", workflow, "workflow")


def get_job(job: str) -> dict:
    """Fetches one job by its id, with each step's exit code.

    Args:
        job: The job id, from list_workflow_jobs.

    Returns:
        The job: its phase, outcome, and per-step detail (name, outcome, exit_code, command).
    """
    return _by_id("get-job", job, "job")


def get_job_logs(
    job: str, step: int | None = None, execution: int = 0, tail_lines: int = 500, raw: bool = False
) -> dict:
    """Fetches the output of a job's steps — by default its failed steps.

    Args:
        job: The job id, from list_workflow_jobs.
        step: A step's num from get_job; omitted reads the failed steps.
        execution: For a parallel job, the zero-based execution to read.
        tail_lines: Keep only the last N lines of each step. Defaults to 500.
        raw: Return the raw terminal capture. Defaults to false.

    Returns:
        An object with a `steps` list; each carries num, name, outcome, exit_code, stdout,
        stderr and truncated.
    """
    payload = _by_id("job-logs", job, "job")
    steps = payload.get("steps")
    if not isinstance(steps, list):
        return payload
    if step is not None:
        steps = [s for s in steps if s.get("num") == step]

    def tail(text: str) -> str:
        return "\n".join(text.splitlines()[-tail_lines:]) if text else text

    return {
        **payload,
        "steps": [
            {**s, "stdout": tail(s.get("stdout", "")), "stderr": tail(s.get("stderr", ""))}
            for s in steps
        ],
    }


def rerun_workflow(workflow: str, from_failed: bool = False) -> dict:
    """Reruns a workflow. In the stub backend nothing is rerun.

    Args:
        workflow: The workflow id to rerun.
        from_failed: Rerun only the failed jobs and what depends on them.

    Returns:
        An object with `workflow`, the new workflow's id.
    """
    return {"workflow": "00000000-0000-4000-8000-000000000000"}


def cancel_workflow(workflow: str) -> dict:
    """Cancels a running workflow. In the stub backend nothing is canceled.

    Args:
        workflow: The workflow id to cancel.

    Returns:
        An object with `workflow`, the canceled workflow's id.
    """
    return {"workflow": workflow}


STUB_TOOLS = [
    list_projects,
    list_runs,
    get_run,
    list_run_workflows,
    get_workflow,
    list_workflow_jobs,
    get_job,
    get_job_logs,
    rerun_workflow,
    cancel_workflow,
]
