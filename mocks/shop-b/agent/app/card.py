"""The app's AgentCard document: what this store can be asked for, in a shopper's words.

The hub routes on this document. The two mock stores are described with their own
character rather than as a matched pair (task-4.6 decision 8): the Router applies no
similarity threshold — it ranks and slices to the shortlist cap — so with a roster of
two both always reach the Planner, and the Planner is where the semantic selection is
made.
"""

from a2a.types import AgentSkill

APP_NAME = "Shop B"

STORE_BRAND = "Northlight"

APP_DESCRIPTION = "Northlight Cameras, a high-volume online retailer listing current stock with live pricing and next-day dispatch."

SKILLS = [
    AgentSkill(
        id="browse-cameras",
        name="Browse cameras",
        description=(
            "Lists everything Northlight has in stock right now with its live price and its customer rating, and opens any single line in full. Prices track supplier feeds, so the list is what the warehouse holds today rather than a curated selection."
        ),
        tags=["cameras", "shopping", "prices", "shop-b"],
        examples=[
            "What cameras do you have?",
            "Show me your camera stock",
            "How much is the Orbit GM3 at Northlight?",
            "Which of your cameras is rated best?",
        ],
    ),
    AgentSkill(
        id="store-policy",
        name="Shipping and returns",
        description=(
            "Answers questions about Northlight's next-day dispatch cutoff, free delivery threshold, and the fourteen-day returns window for unopened stock."
        ),
        tags=["shipping", "returns", "warranty", "shop-b"],
        examples=[
            "What is your returns policy?",
            "How fast do you ship?",
            "Do your cameras come with a warranty?",
        ],
    ),
]
