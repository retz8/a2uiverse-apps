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

# Every app's: a write it drafts for the person to confirm is plain UI, never a question, and a
# proposal dismissed is repainted settled (a2uiverse task-12.13 decision 40).
PROPOSALS = (
    "A write you draft for the person to confirm — an event, a reply, an issue, a rerun — is a "
    'proposal, not a question: never declare it kind="question". Declare a question only when '
    "you cannot go on without the person's choice, such as which of two things they mean. When "
    "the person dismisses a proposal outright — Discard, Not now — repaint the same surface "
    "settled: its buttons gone, and one plain line saying what did not happen, such as "
    "'Discarded — not added to your calendar'. A dismissed proposal is never left with live "
    "buttons. Backing out of a confirm step to edit the draft is not dismissing it: return the "
    "person to the draft."
)

# Every app's: a time is shown in the person's zone where a tool gives it so, never converted by
# the model, and written for a person to read (a2uiverse task-12.13 decision 53).
TIMES = (
    "A time you show is read by the person as theirs. Pass the person's time zone, which the "
    "request states, on every call to a tool that takes one, a wider second search included, so "
    "its times come back as theirs; where a tool takes none, show the time as the tool gave it, "
    "with its zone named. Never convert a time from one zone to another yourself. Write a time "
    "the way a person reads it, never as a raw timestamp such as 2026-10-09T21:00:00-04:00, and "
    "keep its date and year where the request asks for the full date and time. Today and tomorrow "
    "are the person's, by the date the request states: say them only of a time in their zone. "
    "Never show a code value such as None, null or true: leave out what has no value."
)


def build_system_prompt(
    config: AgentAppConfig, schema_manager: A2uiSchemaManager | None = None
) -> str:
    """Assembles the full system instruction via the SDK's generate_system_prompt.

    Authored content is the config's role prose plus the kit's failure wording,
    proposals rule and time rule, the config's workflow blocks and the domain doc (joined into the
    workflow slot, which is the only one that takes free authored prose); the brand doc
    feeds ui_description, and the full catalog schema and the examples are injected by
    the SDK (with the examples framing spliced under
    the SDK's header — it offers no slot for it).
    """
    sm = schema_manager or catalog_context(config).live_schema_manager()
    prompt = sm.generate_system_prompt(
        role_description=config.role_description,
        workflow_description="\n\n".join(
            [
                FAILURE_WORDING,
                PROPOSALS,
                TIMES,
                *config.workflow_descriptions,
                load_domain_knowledge(config),
            ]
        ),
        ui_description=load_brand_guidance(config),
        include_schema=True,
        include_examples=True,
    )
    return prompt.replace(
        _EXAMPLES_HEADER, _EXAMPLES_HEADER + config.examples_framing + "\n\n", 1
    )
