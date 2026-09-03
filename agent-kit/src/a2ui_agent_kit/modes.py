"""The mode -> behavior mapping: `deterministic | stub | live` resolved to an executor.

The run mode is the CLI's `--mode` flag; nothing reads an environment switch. The two
LLM modes differ only in the toolset handed to the ADK agent — the config's stub tools
or its live toolset factory. Executor imports are deferred per branch so deterministic
mode never imports ADK.
"""

from __future__ import annotations

import logging
import os

from a2ui_agent_kit.config import DEFAULT_MODEL, AgentAppConfig

logger = logging.getLogger(__name__)

MODES = ("deterministic", "stub", "live")


def model_name(config: AgentAppConfig) -> str:
    return os.environ.get("MODEL_NAME", config.model or DEFAULT_MODEL)


def build_tools(config: AgentAppConfig, mode: str) -> list:
    """Resolves the tool backend for an LLM mode, naming the choice in the log.

    The log line is what makes a live default safe: which backend answered is
    never a guess.
    """
    if mode == "stub":
        logger.info(
            "tool backend: stub — %d canned tools, no live vendor calls (--mode stub)",
            len(config.stub_tools),
        )
        return list(config.stub_tools)
    if mode == "live":
        if config.live_toolset_factory is None:
            raise ValueError(
                "--mode live needs a live_toolset_factory on the app config."
            )
        toolset = config.live_toolset_factory()
        logger.info("tool backend: live — vendor MCP toolset %s", type(toolset).__name__)
        return [toolset]
    raise ValueError(
        f"mode {mode!r} is not a known mode; expected 'deterministic', 'stub' or 'live'."
    )


def _make_after_tool(config: AgentAppConfig):
    def _after_tool(*, tool, args, tool_context, tool_response, **_extra):  # noqa: ANN001, ARG001
        """Shapes a tool response before the model reads it. Returns None to pass through.

        ADK invokes this by keyword, and has grown parameters across versions — hence the
        keyword-only signature plus `**_extra`, so a new one cannot break a live turn.
        """
        tool_name = getattr(tool, "name", str(tool))
        return config.after_tool(tool_name, tool_response)

    return _after_tool


def build_llm_agent(config: AgentAppConfig, mode: str, model: str | None = None):
    """Constructs the ADK LlmAgent with the assembled system prompt and tools."""
    from google.adk.agents import LlmAgent

    from a2ui_agent_kit.prompt import build_system_prompt

    prompt = build_system_prompt(config)
    # Debug aid: dump the assembled system prompt so it can be inspected verbatim.
    dump_path = config.app_dir / "system_prompt.dump.txt"
    dump_path.write_text(prompt, encoding="utf-8")
    return LlmAgent(
        name=config.adk_agent_name,
        model=model or model_name(config),
        # A provider callable, not a plain string: ADK templates string instructions
        # against session state, and the schema/example JSON braces in the prompt
        # (e.g. `{path}`) would be read as state variables and raise KeyError.
        instruction=lambda _ctx: prompt,
        tools=build_tools(config, mode),
        after_tool_callback=_make_after_tool(config) if config.after_tool else None,
    )


def resolve_executor(config: AgentAppConfig, mode: str):
    """The executor for a mode, behind lazy imports (deterministic never imports ADK)."""
    if mode == "deterministic":
        from a2ui_agent_kit.executor_deterministic import DeterministicAgentExecutor

        return DeterministicAgentExecutor(config.build_response, config.build_text_response)
    if mode in ("stub", "live"):
        from a2ui_agent_kit.executor_llm import LlmAgentExecutor
        from a2ui_agent_kit.responder import AdkLlmResponder

        responder = AdkLlmResponder(
            build_llm_agent(config, mode), app_name=config.responder_app_name
        )
        return LlmAgentExecutor(responder, config)
    raise ValueError(
        f"mode {mode!r} is not a known mode; expected 'deterministic', 'stub' or 'live'."
    )
