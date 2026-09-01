"""The app's AgentCard document — the Router's retrieval corpus (phase decisions
10/11, task-2.6 decision 6). It describes what the agent can be asked for, in the
user's vocabulary, never how it is built; every run mode presents this same document.

Deterministic mode matters as much as live mode here: it is the composition harness
(decision 11), so it is the mode the no-LLM fan-out demo routes over.
"""

from a2a.types import AgentSkill

APP_NAME = "Gmail"

APP_DESCRIPTION = (
    "Reads and acts on the user's Gmail mailbox: finds the threads that need them, "
    "opens a conversation, drafts a reply for them to finish, and files mail with labels."
)

# The first skill carries the cross-cutting "what needs my attention" examples: every
# card in the phase covers that space through its own vocabulary, or the fan-out
# utterance reaches only the agent it happens to match.
SKILLS = [
    AgentSkill(
        id="inbox_triage",
        name="Inbox triage",
        description=(
            "Finds the mail that needs the user: threads where someone is waiting on a "
            "reply, what arrived recently, what is still unread."
        ),
        tags=["a2ui", "gmail", "email", "inbox", "triage"],
        examples=[
            "What needs my attention today?",
            "What's on my plate?",
            "Anything I need to deal with this morning?",
            "Show me the emails waiting on a reply",
            "What came in overnight?",
            "Do I have any unread mail from this week?",
        ],
    ),
    AgentSkill(
        id="thread_reading",
        name="Reading a conversation",
        description=(
            "Opens one email thread and shows the conversation: who wrote what, in "
            "order, with the latest message — the one that needs answering — in full."
        ),
        tags=["a2ui", "gmail", "email", "thread"],
        examples=[
            "Open the thread from my advisor",
            "What did they say about the budget?",
            "Show me that email about the schedule change",
            "Read me the last message in that conversation",
        ],
    ),
    AgentSkill(
        id="reply_drafting",
        name="Drafting a reply",
        description=(
            "Composes a reply to a thread and saves it as a draft for the user to "
            "review and finish themselves."
        ),
        tags=["a2ui", "gmail", "email", "draft", "compose"],
        examples=[
            "Draft a reply saying I can make Thursday",
            "Write back and say I'll have it by Friday",
            "Reply to that thanking them and asking for the file",
            "Draft a short answer declining the meeting",
        ],
    ),
    AgentSkill(
        id="labelling",
        name="Filing and labelling",
        description=(
            "Files mail: adds and removes labels, archives a thread out of the inbox, "
            "and shows what labels exist."
        ),
        tags=["a2ui", "gmail", "email", "labels", "archive"],
        examples=[
            "Archive that thread",
            "Label this one as travel",
            "Take the receipts out of my inbox",
            "What labels do I have?",
        ],
    ),
]
