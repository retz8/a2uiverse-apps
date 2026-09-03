"""The app's AgentCard document — the Router's retrieval corpus (phase decisions
10/11, task-2.6 decision 6). It describes what the agent can be asked for, in the
user's vocabulary, never how it is built; every run mode presents this same document.
"""

from a2a.types import AgentSkill

APP_NAME = "GitHub"

APP_DESCRIPTION = (
    "Reads and acts on the user's GitHub: finds the pull requests that need them, opens "
    "one to its discussion and reviews, and posts, reviews, merges, and manages things "
    "for them — content-bearing actions drafted as a proposal and fired on their "
    "confirmation."
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
            "Helps write review feedback on a pull request: drafts the review with the "
            "user, then submits it on their confirmation."
        ),
        tags=["a2ui", "github", "pull-requests", "review", "compose"],
        examples=[
            "Help me review that PR",
            "Draft my review comments for #58",
            "Start a review on the streaming fix",
            "Write up my feedback on this pull request",
        ],
    ),
    AgentSkill(
        id="acting",
        name="Acting on GitHub",
        description=(
            "Performs GitHub actions as the user: comments on issues and pull requests, "
            "opens issues and pull requests, merges, edits files, and manages "
            "notifications. Content-bearing actions are drafted as a proposal showing "
            "where they will land and fire on the user's confirmation; quick toggles "
            "fire directly."
        ),
        tags=["a2ui", "github", "write", "comment", "issue", "merge", "notifications"],
        examples=[
            "Comment on that issue that I'll pick it up tomorrow",
            "Open an issue about the flaky beat test",
            "Reply to the review comment on #58",
            "Merge the streaming fix PR",
            "Mark all my notifications read",
        ],
    ),
]
