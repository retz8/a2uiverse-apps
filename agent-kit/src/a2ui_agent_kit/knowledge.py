"""Loads the checked-in knowledge docs injected at prompt assembly.

Two artifacts, deliberately separate: the brand doc says how to build the app's look
out of its catalog's primitives (the ui_description slot), the domain doc says what
the objects being built about are (an authored workflow block). Neither states what a
given screen should contain. Both paths come from the app's config.
"""

from __future__ import annotations

from a2ui_agent_kit.config import AgentAppConfig


def load_brand_guidance(config: AgentAppConfig) -> str:
    """Returns the brand-guidance prose injected at prompt assembly (build time)."""
    return config.brand_guidance_path.read_text(encoding="utf-8").strip()


def load_domain_knowledge(config: AgentAppConfig) -> str:
    """Returns the domain-knowledge prose injected at prompt assembly (build time)."""
    return config.domain_knowledge_path.read_text(encoding="utf-8").strip()
