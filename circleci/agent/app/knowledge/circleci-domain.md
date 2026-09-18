# CircleCI domain knowledge

What the objects in this domain are, how they relate, and what a person is deciding when they ask
about one. This doc holds **facts and the decisions that hinge on them** — never what a screen
should contain. Composition is yours: you read the request, work out what the person is trying to
decide, and build the surface that serves it.

Register: declarative. `brand-guidance.md` is imperative and covers how to build in CircleCI's
visual language; this covers what you are building _about_. A fact the model would already apply
earns no place here — what follows is what is easy to get wrong, or what a decision genuinely
turns on.

---

## Projects

- A **project** is one repository built by CircleCI. The user's projects are what `list_projects`
  returns: each project's repository name and its id. A project is named to `list_runs` by that
  id.

## Runs, workflows, jobs, steps

- A **run** is one execution of a project's pipeline, created each time a trigger fires — a push
  to a branch. A run groups the workflows its config produced.
- A run names its commit twice: `branch`, the branch that was pushed, and `revision`, the full
  commit hash. CircleCI shows a hash by its first seven characters.
- A run's commit `subject` arrives as the whole commit message. Its first line is the subject; the
  rest — body, trailers such as `Co-Authored-By:` — is not.
- A **workflow** is a named set of jobs inside a run; one run can hold several. A **job** is one
  unit of work inside a workflow, run in its own container; jobs of a workflow run in parallel
  unless one requires another. A **step** is one command inside a job.
- Ids are distinct per level. A run id, a workflow id and a job id are not interchangeable, and no
  tool accepts a job number or a CircleCI web URL.

## Phase and outcome

- `phase` says where something is in its life: `created`, `queued`, `started`, `ended`. An
  `outcome` exists only once it has ended. **A run that is still going has no outcome** — it is
  running, not unknown and not failed.
- A run reports its result in `current_outcome`; a workflow and a job in `outcome`. Outcomes are
  `succeeded`, `failed`, `canceled`, `errored`, `not_run`, `unauthorized`, `infrastructure_fail`,
  `timedout`.
- A run's result is its workflows' results. A run whose outcome is failed has at least one
  workflow that failed, and the job that failed inside it is where the reason is.
- `errors` on a run are config errors: the pipeline could not be built at all, so it has no
  workflows to show.

## Reruns and cancels

- **A rerun is additive.** Rerunning a workflow creates a new workflow, with a new id and the same
  name, inside the same run; the attempt it reran stays as it was. No new run appears. The run's
  `current_outcome` follows its latest attempts, so a run that failed can later succeed.
- Of several workflows with the same name in one run, the latest by `created_at` is the current
  attempt. A run's page shows every attempt, newest first — the history is how the person tells
  a flaky failure from a real one.
- After a rerun is confirmed, the run is what changed: read its workflows again with
  `list_run_workflows` and show the run with the new attempt beside the one it reran.
- A rerun reruns every job from the start, or — `from_failed` — only the failed jobs and what
  depends on them, reusing the jobs that succeeded. Only an ended workflow can be rerun.
- **A cancel stops running work.** Only a workflow that has not ended can be canceled, and a cancel
  is asynchronous: the call returning means the request was accepted, not that the workflow has
  stopped.
- Neither write can be undone. A canceled workflow can only be rerun, which is a new attempt.

## Why a job failed

- `get_job` names each step with its `exit_code`; the failed step is the one with a non-zero exit
  code. That answers "which step" cheaply.
- A step's output is `get_job_logs`. The error is almost always in the last lines, and the log's
  top is setup noise — checkout, environment, cache restore. What the person needs is the failing
  command and the lines around its error.
- A log line is the vendor's output, not prose: it is shown as printed, never paraphrased.

## What a request is deciding

- **"How are my builds doing"** is deciding which branches are broken. The latest run on a branch
  is that branch's state; older runs on the same branch are history it superseded.
- **"Why did it fail"** is deciding what to fix: the failed job, its failed step, and that step's
  error. A run with no failed job has nothing to explain.
- **"Rerun it"** is deciding whether a failure was the code or the environment. Rerunning only the
  failed jobs is the faster retry of a failure that was not the code.
