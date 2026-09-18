"""The app's AgentCard document — the Router's retrieval corpus (task-2.6 decision 6).

It describes what the agent can be asked for, in a CircleCI user's vocabulary, never how it
is built; every run mode presents this same document. Deterministic mode matters as much as
live mode here: it is the mode the no-LLM composition harness routes over.
"""

from a2a.types import AgentSkill

APP_NAME = "CircleCI"

APP_DESCRIPTION = (
    "Shows the user's CircleCI pipelines: recent runs by branch and commit with their "
    "outcome, each run's workflows and jobs, and why a job failed from its logs. Reruns or "
    "cancels a workflow once the user confirms."
)

# The first skill carries the cross-cutting "what needs attention" examples: a failing
# build is what a CircleCI user means by that, and every card covers the space through its
# own vocabulary.
SKILLS = [
    AgentSkill(
        id="pipeline_status",
        name="Pipeline status",
        description=(
            "Shows recent pipeline runs across the user's projects: which branch and commit "
            "each ran on, whether it passed, failed or is still running, and its workflows."
        ),
        tags=["a2ui", "circleci", "ci", "pipelines", "builds"],
        examples=[
            "How are my builds doing?",
            "Is CI green on main?",
            "Did my last push pass CI?",
            "Which branches are failing?",
            "Anything broken in CI I should look at?",
            "Show me the recent pipeline runs",
        ],
    ),
    AgentSkill(
        id="run_detail",
        name="A run's workflows and jobs",
        description=(
            "Opens one pipeline run and shows its workflows and each workflow's jobs, with "
            "their status and how long they took."
        ),
        tags=["a2ui", "circleci", "ci", "workflow", "jobs"],
        examples=[
            "Open the latest run on main",
            "Which job failed?",
            "Show me the jobs in that workflow",
            "What ran for my last commit?",
        ],
    ),
    AgentSkill(
        id="failure_diagnosis",
        name="Why a job failed",
        description=(
            "Finds the step that failed in a job and shows what it printed: the failing "
            "command, its exit code, and the end of its log."
        ),
        tags=["a2ui", "circleci", "ci", "logs", "failure"],
        examples=[
            "Why did the build fail?",
            "Show me the logs of the failing job",
            "What broke in the lint job?",
            "What error did the tests hit?",
        ],
    ),
    AgentSkill(
        id="rerun_cancel",
        name="Rerunning and canceling",
        description=(
            "Reruns a workflow — every job, or only the failed ones — or cancels one that is "
            "still running, after the user confirms."
        ),
        tags=["a2ui", "circleci", "ci", "rerun", "cancel"],
        examples=[
            "Rerun the failed workflow",
            "Rerun only the failed jobs",
            "Retry CI on main",
            "Cancel the running build",
        ],
    ),
]
