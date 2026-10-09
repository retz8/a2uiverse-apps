"""Prompt-assembly mechanics: slot mapping, join order, and the examples splice."""

from a2ui_agent_kit.knowledge import load_brand_guidance, load_domain_knowledge
from a2ui_agent_kit.prompt import _EXAMPLES_HEADER, FAILURE_WORDING, build_system_prompt


def test_prompt_carries_role_workflow_domain_and_brand(any_config):
    prompt = build_system_prompt(any_config)
    assert any_config.role_description in prompt
    for block in any_config.workflow_descriptions:
        assert block in prompt
    assert load_domain_knowledge(any_config) in prompt
    assert load_brand_guidance(any_config) in prompt


def test_workflow_blocks_join_in_order_with_the_domain_doc_last(any_config):
    prompt = build_system_prompt(any_config)
    joined = "\n\n".join(
        [*any_config.workflow_descriptions, load_domain_knowledge(any_config)]
    )
    assert joined in prompt


def test_examples_framing_is_spliced_once_directly_under_the_header(any_config):
    prompt = build_system_prompt(any_config)
    assert prompt.count(any_config.examples_framing) == 1
    assert _EXAMPLES_HEADER + any_config.examples_framing + "\n\n" in prompt


def test_prompt_includes_the_catalog_schema_and_examples(any_config):
    prompt = build_system_prompt(any_config)
    assert "Column" in prompt  # schema included
    assert "---BEGIN" in prompt  # examples rendered


def test_a_failure_said_in_words_is_worded_for_the_person_ahead_of_the_vendor_blocks(any_config):
    # a2uiverse task-12.13 decision 36: "403 Forbidden error" reached the canvas.
    prompt = build_system_prompt(any_config)
    assert prompt.count(FAILURE_WORDING) == 1
    assert FAILURE_WORDING + "\n\n" + any_config.workflow_descriptions[0] in prompt
    for term in ("status code", "token", "scope"):
        assert term in FAILURE_WORDING
