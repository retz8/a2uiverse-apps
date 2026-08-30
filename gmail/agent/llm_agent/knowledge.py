"""Loads the checked-in knowledge docs injected at prompt assembly.

Two artifacts, deliberately separate: the brand doc says how to build Gmail's Material 3
look out of the basic catalog's primitives (the ui_description slot), the domain doc says
what the objects being built about are (an authored workflow block). Neither states what a
given screen should contain.
"""

from __future__ import annotations

from pathlib import Path

_KNOWLEDGE_DIR = Path(__file__).resolve().parents[1] / "knowledge"

BRAND_GUIDANCE_PATH = _KNOWLEDGE_DIR / "brand-guidance.md"
DOMAIN_KNOWLEDGE_PATH = _KNOWLEDGE_DIR / "gmail-domain.md"


def load_brand_guidance() -> str:
    """Returns the Material 3 brand-guidance prose injected at prompt assembly (build time)."""
    return BRAND_GUIDANCE_PATH.read_text(encoding="utf-8").strip()


def load_domain_knowledge() -> str:
    """Returns the Gmail domain-knowledge prose injected at prompt assembly (build time)."""
    return DOMAIN_KNOWLEDGE_PATH.read_text(encoding="utf-8").strip()
