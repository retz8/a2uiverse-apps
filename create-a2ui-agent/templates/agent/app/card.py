"""The app's AgentCard document: what the agent can be asked for, in the user's vocabulary.

A hub routes on this document — skills named by capability, each with real example
utterances — so it describes what the agent does for a person, never how it is built.
Every run mode presents this same card.

TODO: replace the placeholder skill with one per capability, each with several examples
phrased the way a user would ask.
"""

from a2a.types import AgentSkill

APP_NAME = "__DISPLAY_NAME__"

APP_DESCRIPTION = "__DESCRIPTION__"

SKILLS = [
    AgentSkill(
        id="greeting",
        name="Greeting",
        description="Greets the user with a surface. A placeholder for the app's first real skill.",
        tags=["a2ui", "__APP_ID__"],
        examples=[
            "Say hello",
            "Greet me",
            "Show me a greeting",
        ],
    ),
]
