"""The app's AgentCard document — the Router's retrieval corpus (phase decisions
10/11, task-2.6 decision 6). It describes what the agent can be asked for, in the
user's vocabulary, never how it is built; every run mode presents this same document.
"""

from a2a.types import AgentSkill

APP_NAME = "GitHub"

APP_DESCRIPTION = (
    "Reads the user's GitHub pull requests: finds the ones that need them, opens one "
    "to its discussion and reviews, and helps compose review feedback."
)

# The first skill carries the cross-cutting "what needs my attention" examples: every
# card in the phase covers that space through its own vocabulary, or the fan-out
# utterance reaches only the agent it happens to match.
SKILLS = [
    AgentSkill(
        id="pr_triage",
        name="Pull request triage",
        description=(
            "Finds the pull requests that need the user: the ones waiting on their "
            "review, what changed recently, and what is still open."
        ),
        tags=["a2ui", "github", "pull-requests", "review", "triage"],
        examples=[
            "What needs my attention today?",
            "What's on my plate?",
            "What pull requests need my review?",
            "Show my open pull requests",
            "Anything new on the repo?",
            "Which PRs are still waiting on me?",
        ],
    ),
    AgentSkill(
        id="pr_reading",
        name="Reading a pull request",
        description=(
            "Opens one pull request and shows the conversation around it: the "
            "description, the discussion, its reviews, and where it stands."
        ),
        tags=["a2ui", "github", "pull-requests", "detail"],
        examples=[
            "Open the PR about the streaming fix",
            "What changed in #58?",
            "Show me that pull request",
            "Where does the review stand on it?",
        ],
    ),
    AgentSkill(
        id="review_compose",
        name="Composing a review",
        description=(
            "Helps write review feedback on a pull request, drafted for the user to "
            "finish and submit themselves; it does not submit reviews or change "
            "anything on GitHub."
        ),
        tags=["a2ui", "github", "pull-requests", "review", "compose"],
        examples=[
            "Help me review that PR",
            "Draft my review comments for #58",
            "Start a review on the streaming fix",
            "Write up my feedback on this pull request",
        ],
    ),
]
