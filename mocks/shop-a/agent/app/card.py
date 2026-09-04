"""The app's AgentCard document: what this store can be asked for, in a shopper's words.

The hub routes on this document. The two mock stores are described with their own
character rather than as a matched pair (task-4.6 decision 8): the Router applies no
similarity threshold — it ranks and slices to the shortlist cap — so with a roster of
two both always reach the Planner, and the Planner is where the semantic selection is
made.
"""

from a2a.types import AgentSkill

APP_NAME = "Shop A"

STORE_BRAND = "Aperture & Co"

APP_DESCRIPTION = "Aperture & Co, a boutique camera dealer stocking hand-picked bodies with condition notes and staff ratings."

SKILLS = [
    AgentSkill(
        id="browse-cameras",
        name="Browse cameras",
        description=(
            "Lists the camera bodies Aperture & Co currently has on the shelf, each with its price and the rating its staff gave it after inspection, and opens any one of them in full. The shelf is small and hand-picked rather than a full-range catalogue."
        ),
        tags=["cameras", "shopping", "prices", "shop-a"],
        examples=[
            "What cameras do you have?",
            "Show me your camera stock",
            "What does the Lumen X100 cost at Aperture?",
            "Which of your cameras is rated best?",
        ],
    ),
    AgentSkill(
        id="store-policy",
        name="Shipping and returns",
        description=(
            "Answers questions about Aperture & Co's dispatch times, its thirty-day returns window, and the twelve-month workshop warranty every graded body carries."
        ),
        tags=["shipping", "returns", "warranty", "shop-a"],
        examples=[
            "What is your returns policy?",
            "How fast do you ship?",
            "Do your cameras come with a warranty?",
        ],
    ),
]
