"""The app's AgentCard document — the Router's retrieval corpus (phase decisions
10/11, task-2.6 decision 6). It describes what the agent can be asked for, in the
user's vocabulary, never how it is built; every run mode presents this same document.

Deterministic mode matters as much as live mode here: it is the composition harness
(decision 11), so it is the mode the no-LLM fan-out demo routes over.
"""

from a2a.types import AgentSkill

APP_NAME = "Google Calendar"

APP_DESCRIPTION = (
    "Reads and acts on the user's Google Calendar: shows what is coming up and what is "
    "still unanswered, opens a single event with its attendees, proposes a new event for "
    "the user to confirm, and answers invitations on their behalf."
)

# The first skill carries the cross-cutting "what needs my attention" examples: every
# card in the phase covers that space through its own vocabulary, or the fan-out
# utterance reaches only the agent it happens to match.
SKILLS = [
    AgentSkill(
        id="agenda_triage",
        name="What is coming up",
        description=(
            "Finds what the user's calendar needs from them: what is on today and next, "
            "invitations still waiting on an answer, and where the day is double-booked."
        ),
        tags=["a2ui", "calendar", "schedule", "agenda", "triage"],
        examples=[
            "What needs my attention today?",
            "What's on my plate?",
            "Anything I need to deal with this morning?",
            "What's on my calendar today?",
            "What does the rest of my week look like?",
            "Do I have anything I haven't replied to?",
            "Am I double-booked at any point tomorrow?",
            "When is my next meeting?",
        ],
    ),
    AgentSkill(
        id="event_detail",
        name="Looking at one event",
        description=(
            "Opens a single event and shows what it is: when and where, who is invited, "
            "who has accepted, and the notes that came with it."
        ),
        tags=["a2ui", "calendar", "event", "attendees"],
        examples=[
            "What's the standup about?",
            "Who's coming to the review?",
            "Where is that meeting?",
            "Show me the details of my 2pm",
            "Has anyone declined the planning session?",
        ],
    ),
    AgentSkill(
        id="event_creation",
        name="Putting something on the calendar",
        description=(
            "Proposes a new event — time, title, attendees — and creates it once the user "
            "confirms the proposal."
        ),
        tags=["a2ui", "calendar", "event", "scheduling", "create"],
        examples=[
            "Put a half hour with the design team on Thursday",
            "Block out Friday afternoon for writing",
            "Schedule a call with them next week",
            "Add lunch tomorrow at noon",
        ],
    ),
    AgentSkill(
        id="invitation_response",
        name="Answering an invitation",
        description=(
            "Answers an invitation on the user's behalf: accept, decline, or mark it "
            "tentative."
        ),
        tags=["a2ui", "calendar", "rsvp", "invitation"],
        examples=[
            "Accept the invite for Thursday",
            "Decline the all-hands",
            "Mark me as tentative for that one",
            "Say yes to the design review",
        ],
    ),
]
