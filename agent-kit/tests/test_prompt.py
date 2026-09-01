"""Prompt-assembly mechanics: slot mapping, join order, and the examples splice."""

from a2uiverse_kit.knowledge import load_brand_guidance, load_domain_knowledge
from a2uiverse_kit.prompt import _EXAMPLES_HEADER, build_system_prompt


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
