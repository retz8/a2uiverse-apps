"""Hybrid snapshot for the assembled system prompt.

Byte-pins the stable framing (authored role, workflow rules, section headers, schema-block
markers) while eliding the four volatile bulks to markers: the domain doc, the brand doc,
the catalog schema render, and the examples. Presence assertions prove each elided bulk is
actually there, so knowledge-doc and example edits never churn the snapshot while the
framing stays byte-pinned.
"""

import re
from pathlib import Path

from a2ui.schema.constants import A2UI_SCHEMA_BLOCK_END, A2UI_SCHEMA_BLOCK_START

from a2ui_agent_kit.prompt import build_system_prompt as _build_system_prompt

from app.config import CONFIG

EXAMPLES_DIR = CONFIG.examples_dir


def build_system_prompt() -> str:
    return _build_system_prompt(CONFIG)


_GOLDEN = Path(__file__).resolve().parent / "golden" / "llm_system_prompt.skeleton.txt"

_DOMAIN_MARKER = "<<<DOMAIN>>>"
_UI_MARKER = "<<<UI_DESCRIPTION>>>"
_SCHEMA_MARKER = "<<<CATALOG_SCHEMA>>>"
_EXAMPLES_MARKER = "<<<EXAMPLES>>>"

_DOMAIN_HEADING = "# __DISPLAY_NAME__ domain knowledge"
_BRAND_HEADING = "# __DISPLAY_NAME__ brand guidance"


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
    prompt = re.sub(r"---BEGIN .*\Z", _EXAMPLES_MARKER, prompt, flags=re.DOTALL)
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
    assert _BRAND_HEADING not in skeleton
    assert "Catalog Schema:" not in skeleton


def test_examples_section_frames_the_examples_as_idioms():
    prompt = build_system_prompt()
    start = prompt.index("### Examples:")
    framing = prompt[start : prompt.index("---BEGIN ", start)]
    assert "illustrative" in framing
    assert "tool" in framing


def test_workflow_instructs_send_data_model():
    assert '"sendDataModel": true' in build_system_prompt()


def test_elided_bulk_is_actually_present():
    prompt = build_system_prompt()
    assert A2UI_SCHEMA_BLOCK_START in prompt and A2UI_SCHEMA_BLOCK_END in prompt
    assert "catalogId" in prompt
    assert _BRAND_HEADING in prompt
    assert _DOMAIN_HEADING in prompt
    for path in sorted(EXAMPLES_DIR.glob("*.json")):
        assert path.stem in prompt
