"""The app's AgentCard document — the Router's retrieval corpus (task-2.6 decision 6).

It describes what the agent can be asked for, in a Linear user's vocabulary, never how it is
built; every run mode presents this same document. Deterministic mode matters as much as live
mode here: it is the mode the no-LLM composition harness routes over.
"""

from a2a.types import AgentSkill

APP_NAME = "Linear"

APP_DESCRIPTION = (
    "Shows the user's Linear issues: what is assigned to them or in a team's queue, by status "
    "and priority; an issue's description, comments and linked pull requests. Creates an "
    "issue, updates its status, priority, assignee or labels, or comments on it once the user "
    "confirms."
)

# The first skill carries the cross-cutting "what needs attention" examples: an urgent issue
# assigned to the user is what a Linear user means by that, and every card covers the space
# through its own vocabulary.
SKILLS = [
    AgentSkill(
        id="my_issues",
        name="Issues",
        description=(
            "Lists the user's Linear issues or a team's, with each issue's identifier, title, "
            "status and priority — what is in progress, what is up next, what is urgent."
        ),
        tags=["a2ui", "linear", "issues", "tickets", "tasks"],
        examples=[
            "What's assigned to me in Linear?",
            "What am I working on?",
            "Show my open issues",
            "Anything urgent on my plate?",
            "What's in the team's backlog?",
            "Which issues are in progress?",
        ],
    ),
    AgentSkill(
        id="issue_detail",
        name="An issue's detail",
        description=(
            "Opens one issue: its description, status, priority, assignee and labels, its "
            "comments, and the pull requests and branch linked to it."
        ),
        tags=["a2ui", "linear", "issue", "comments"],
        examples=[
            "Open A2U-5",
            "Show me the issue about the login bug",
            "What's the discussion on that issue?",
            "Is there a pull request for this issue?",
        ],
    ),
    AgentSkill(
        id="issue_updates",
        name="Updating an issue",
        description=(
            "Changes an issue's status, priority, assignee or labels, after the user confirms."
        ),
        tags=["a2ui", "linear", "status", "priority", "assign"],
        examples=[
            "Move A2U-5 to In Progress",
            "Mark it done",
            "Set its priority to high",
            "Assign that issue to me",
        ],
    ),
    AgentSkill(
        id="create_and_comment",
        name="Filing an issue and commenting",
        description=(
            "Files a new issue in a team, or adds a comment to an issue, after the user confirms."
        ),
        tags=["a2ui", "linear", "create", "comment"],
        examples=[
            "File an issue for the flaky test",
            "Create a bug: the sort order is wrong",
            "Comment on A2U-5 that the fix is up",
            "Add a note to that issue",
        ],
    ),
]
