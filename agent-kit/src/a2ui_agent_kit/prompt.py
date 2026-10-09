"""System-prompt assembly for the live modes: authored prose + SDK-generated bulk.

The prose itself — role, workflow blocks, examples framing — is vendor data on the
config; this module owns only the assembly: the slot mapping, the join order, and the
examples-framing splice.
"""

from __future__ import annotations

from a2ui.schema.manager import A2uiSchemaManager

from a2ui_agent_kit.catalog import catalog_context
from a2ui_agent_kit.config import AgentAppConfig
from a2ui_agent_kit.knowledge import load_brand_guidance, load_domain_knowledge

# The SDK renders the examples under a bare "### Examples:" header at the end of the
# prompt, where each example — a request-shaped `intent` plus a complete surface with
# plausible data — reads as a ready-made answer to a matching user prompt and gets
# parroted verbatim, canned data and all, with no tool call. The config's framing,
# spliced in right after the header, names what the examples are instead.
_EXAMPLES_HEADER = "### Examples:\n"

# Every app's: a failure the model reports in prose is drawn on the canvas for a person
# who may not work in tech (a2uiverse task-12.13 decision 36).
FAILURE_WORDING = (
    "A failure you report in prose is read on the screen by the person using the app, who "
    "may not work in tech. Say what didn't work, and what they can do about it when there is "
    "something, in their words. Never write an HTTP status code or error name, an exception, "
    "a tool or API name, a URL, or a term from sign-in or the protocol such as token, scope, "
    "permission grant or endpoint."
)


def build_system_prompt(
    config: AgentAppConfig, schema_manager: A2uiSchemaManager | None = None
) -> str:
    """Assembles the full system instruction via the SDK's generate_system_prompt.

    Authored content is the config's role prose plus the kit's failure wording, the
    config's workflow blocks and the domain doc (joined into the workflow slot, which is
    the only one that takes free authored prose); the brand doc feeds ui_description, and the full catalog schema
    and the examples are injected by the SDK (with the examples framing spliced under
    the SDK's header — it offers no slot for it).
    """
    sm = schema_manager or catalog_context(config).live_schema_manager()
    prompt = sm.generate_system_prompt(
        role_description=config.role_description,
        workflow_description="\n\n".join(
            [FAILURE_WORDING, *config.workflow_descriptions, load_domain_knowledge(config)]
        ),
        ui_description=load_brand_guidance(config),
        include_schema=True,
        include_examples=True,
    )
    return prompt.replace(
        _EXAMPLES_HEADER, _EXAMPLES_HEADER + config.examples_framing + "\n\n", 1
    )
