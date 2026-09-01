"""Hybrid snapshot for the assembled system prompt (spec decision 9).

Byte-pins the stable framing (authored role, default workflow rules, authored workflow
description, section headers, schema-block markers) while eliding the four volatile
bulks to markers: the GitHub domain doc, the UI Description (brand doc), the catalog
schema render, and the examples. Presence assertions prove each elided bulk is actually
there. This keeps 7.7's constant knowledge-doc/example edits from churning the snapshot
while the framing stays byte-pinned.
"""

import re
from pathlib import Path

from a2ui.schema.constants import A2UI_SCHEMA_BLOCK_END, A2UI_SCHEMA_BLOCK_START

from a2uiverse_kit.prompt import build_system_prompt as _build_system_prompt

from app.config import CONFIG

EXAMPLES_DIR = CONFIG.examples_dir


def build_system_prompt() -> str:
    return _build_system_prompt(CONFIG)

_GOLDEN = Path(__file__).resolve().parent / "golden" / "llm_system_prompt.skeleton.txt"

_DOMAIN_MARKER = "<<<GMAIL_DOMAIN>>>"
_UI_MARKER = "<<<UI_DESCRIPTION>>>"
_SCHEMA_MARKER = "<<<CATALOG_SCHEMA>>>"
_EXAMPLES_MARKER = "<<<EXAMPLES>>>"

_DOMAIN_HEADING = "# Gmail domain knowledge"


def _skeletonize(prompt: str) -> str:
    # 0. Domain doc body -> marker, bounded by the UI Description header that follows it.
    prompt = re.sub(
        re.escape(_DOMAIN_HEADING) + r".*?(?=\n\n## UI Description:)",
        _DOMAIN_MARKER,
        prompt,
        flags=re.DOTALL,
    )
    # 1. UI Description (brand doc) body -> marker, bounded by the schema block start.
    prompt = re.sub(
        r"(## UI Description:\n).*?(?=\n\n" + re.escape(A2UI_SCHEMA_BLOCK_START) + r")",
        r"\1" + _UI_MARKER,
        prompt,
        flags=re.DOTALL,
    )
    # 2. Catalog schema render block -> marker.
    prompt = re.sub(
        re.escape(A2UI_SCHEMA_BLOCK_START) + r".*?" + re.escape(A2UI_SCHEMA_BLOCK_END),
        _SCHEMA_MARKER,
        prompt,
        flags=re.DOTALL,
    )
    # 3. Examples body -> marker, from the first example block on — the authored
    #    framing between the header and the blocks stays pinned in the skeleton.
    prompt = re.sub(
        r"---BEGIN .*\Z",
        _EXAMPLES_MARKER,
        prompt,
        flags=re.DOTALL,
    )
    return prompt


def test_prompt_skeleton_matches_golden():
    skeleton = _skeletonize(build_system_prompt())
    if not _GOLDEN.exists():  # first run authors the golden; it is committed thereafter
        _GOLDEN.parent.mkdir(parents=True, exist_ok=True)
        _GOLDEN.write_text(skeleton, encoding="utf-8")
    assert skeleton == _GOLDEN.read_text(encoding="utf-8")


def test_skeleton_elided_all_four_bulks():
    skeleton = _skeletonize(build_system_prompt())
    assert _DOMAIN_MARKER in skeleton
    assert _UI_MARKER in skeleton
    assert _SCHEMA_MARKER in skeleton
    assert _EXAMPLES_MARKER in skeleton
    # the volatile bulk itself must be gone from the skeleton
    assert "Material 3 brand guidance" not in skeleton
    assert "Catalog Schema:" not in skeleton
    assert "Whether it can merge" not in skeleton


def test_examples_section_frames_the_examples_as_idioms():
    # Unframed examples read as an answer bank: a user prompt matching an example's
    # intent gets the example parroted verbatim, canned data and all, with no tool
    # call. The framing between the header and the first block names what they are.
    prompt = build_system_prompt()
    start = prompt.index("### Examples:")
    framing = prompt[start : prompt.index("---BEGIN ", start)]
    assert "illustrative" in framing
    assert "tool" in framing


def test_workflow_instructs_send_data_model():
    # sendDataModel:true on every createSurface is what makes the client report the
    # surface's current data model (selections, form input) back with each message.
    assert '"sendDataModel": true' in build_system_prompt()


def test_elided_bulk_is_actually_present():
    prompt = build_system_prompt()
    # schema render present
    assert A2UI_SCHEMA_BLOCK_START in prompt and A2UI_SCHEMA_BLOCK_END in prompt
    assert "catalogId" in prompt
    # brand doc present (a stable heading from knowledge/brand-guidance.md)
    assert "Material 3 brand guidance" in prompt
    # domain doc present (a stable heading from knowledge/gmail-domain.md)
    assert _DOMAIN_HEADING in prompt
    assert "A reply body is its top segment" in prompt
    # every curated example present by name
    for path in sorted(EXAMPLES_DIR.glob("*.json")):
        assert path.stem in prompt
