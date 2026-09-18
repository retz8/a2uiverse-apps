"""The stub toolset mirrors the live inventory over the derived corpus; stub writes are inert."""

from __future__ import annotations

from app.mcp import CIRCLECI_TOOLS
from app.tools import (
    STUB_TOOLS,
    cancel_workflow,
    get_job,
    get_job_logs,
    list_projects,
    list_run_workflows,
    list_runs,
    list_workflow_jobs,
    rerun_workflow,
)


def test_the_stub_mirrors_the_live_inventory():
    assert {t.__name__ for t in STUB_TOOLS} == {*CIRCLECI_TOOLS, "list_projects"}


def test_the_chain_resolves_through_the_corpus():
    project = list_projects()["projects"][0]["id"]
    runs = list_runs(project=project)["runs"]
    assert runs
    walked_to_a_job = False
    for run in runs:
        workflows = list_run_workflows(run["id"]).get("workflows") or []
        for workflow in workflows:
            jobs = list_workflow_jobs(workflow["id"]).get("jobs") or []
            for job in jobs:
                if "error" not in get_job(job["id"]):
                    walked_to_a_job = True
    assert walked_to_a_job


def test_every_run_carries_its_branch_and_revision():
    for run in list_runs(limit=100)["runs"]:
        vcs = run["references"]["event"]["attributes"]["vcs"]
        assert vcs["branch"] and len(vcs["revision"]) == 40


def test_the_corpus_holds_a_failed_step_with_its_output():
    failed = [
        step
        for payload in (get_job_logs(job_id) for job_id in _job_ids())
        for step in payload.get("steps") or []
        if step.get("exit_code")
    ]
    assert failed and any(step.get("stdout") or step.get("stderr") for step in failed)


def test_log_tail_keeps_only_the_last_lines():
    for job_id in _job_ids():
        for step in get_job_logs(job_id, tail_lines=3).get("steps") or []:
            assert len((step.get("stdout") or "").splitlines()) <= 3


def test_writes_are_acknowledged_and_inert():
    assert rerun_workflow("wf", from_failed=True)["workflow"]
    assert cancel_workflow("wf") == {"workflow": "wf"}


def test_unknown_ids_are_reported_not_raised():
    assert "error" in get_job("no-such-job")
    assert "error" in list_run_workflows("no-such-run")


def _job_ids() -> list[str]:
    from app.tools import _fixture

    return list(_fixture("job-logs"))
