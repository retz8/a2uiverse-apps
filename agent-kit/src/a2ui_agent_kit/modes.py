"""The mode -> behavior mapping: `deterministic | stub | live` resolved to an executor.

The run mode is the CLI's `--mode` flag; nothing reads an environment switch. The two
LLM modes differ only in the toolset handed to the ADK agent — the config's stub tools
or its live toolset factory. Executor imports are deferred per branch so deterministic
mode never imports ADK.
"""

from __future__ import annotations

import logging
import os

from a2ui_agent_kit.config import DEFAULT_EFFORT, DEFAULT_MODEL, EFFORTS, AgentAppConfig
from a2ui_agent_kit.sign_in import SignIn

logger = logging.getLogger(__name__)

MODES = ("deterministic", "stub", "live")

ANTHROPIC_PREFIX = "anthropic/"


def model_name(config: AgentAppConfig) -> str:
    return os.environ.get("MODEL_NAME", config.model or DEFAULT_MODEL)


def model_effort(config: AgentAppConfig) -> str:
    """The thinking tier, resolved as the model name is: env, then config, then default."""
    effort = os.environ.get("MODEL_EFFORT", config.effort or DEFAULT_EFFORT)
    if effort not in EFFORTS:
        raise ValueError(
            f"MODEL_EFFORT {effort!r} is not a tier; expected one of {', '.join(EFFORTS)}."
        )
    return effort


def build_model(name: str):
    """The model ADK's LlmAgent takes: a Claude name as the direct-API class, any other as is.

    ADK's own registry sends a bare `claude-…` to its Vertex class and `anthropic/…` to
    LiteLLM; neither reaches the Anthropic API with an ANTHROPIC_API_KEY, so the kit builds
    that class itself for the prefixed name. Every other name goes to ADK untouched.
    """
    if name.startswith(ANTHROPIC_PREFIX):
        from google.adk.models.anthropic_llm import AnthropicLlm

        return AnthropicLlm(model=name.removeprefix(ANTHROPIC_PREFIX))
    return name


def generate_content_config(effort: str):
    """The generation config for a tier: `low` a thinking budget of zero, `default` none.

    ADK hands the config through to Gemini as it is, and its Anthropic class reads the
    same budget as thinking disabled.
    """
    if effort == "low":
        from google.genai import types as genai_types

        return genai_types.GenerateContentConfig(
            thinking_config=genai_types.ThinkingConfig(thinking_budget=0)
        )
    return None


def build_tools(config: AgentAppConfig, mode: str, account=None) -> list:
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
        # With sign-in, the live toolset is the signed-in account's: the factory gets
        # the account, and its vendor token, once per account.
        produced = (
            config.live_toolset_factory(account)
            if isinstance(config.sign_in, SignIn)
            else config.live_toolset_factory()
        )
        # A vendor's live backend is one MCP toolset; an app with no vendor behind it —
        # a mock (task-4.6 decision 16) — has plain callables instead, the way stub
        # tools already do. "Live means MCP" was an assumption inherited from three
        # vendors that happened to have one, not something the kit needs to assert.
        tools = list(produced) if isinstance(produced, (list, tuple)) else [produced]
        logger.info(
            "tool backend: live — %s",
            ", ".join(getattr(t, "__name__", type(t).__name__) for t in tools) or "nothing",
        )
        return tools
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


def build_llm_agent(
    config: AgentAppConfig, mode: str, model: str | None = None, account=None
):
    """Constructs the ADK LlmAgent with the assembled system prompt and tools."""
    from google.adk.agents import LlmAgent

    from a2ui_agent_kit.catalog_lines import turn_line
    from a2ui_agent_kit.prompt import build_system_prompt
    from a2ui_agent_kit.sign_in import before_tool_check

    prompt = build_system_prompt(config)
    # An old catalog line's turns run on its own prompt, in the same conversation
    # (a2uiverse task-15.7).
    old = config.old_catalog_line
    old_prompt = build_system_prompt(config, line=old) if old is not None else None
    # Debug aid: dump the assembled system prompt so it can be inspected verbatim.
    dump_path = config.app_dir / "system_prompt.dump.txt"
    dump_path.write_text(prompt, encoding="utf-8")
    if old_prompt is not None:
        (config.app_dir / "system_prompt.old.dump.txt").write_text(old_prompt, encoding="utf-8")
    return LlmAgent(
        name=config.adk_agent_name,
        model=build_model(model or model_name(config)),
        generate_content_config=generate_content_config(model_effort(config)),
        # A provider callable, not a plain string: ADK templates string instructions
        # against session state, and the schema/example JSON braces in the prompt
        # (e.g. `{path}`) would be read as state variables and raise KeyError.
        instruction=lambda _ctx: old_prompt if old is not None and turn_line() is old else prompt,
        tools=build_tools(config, mode, account),
        # A tool needing a scope the token lacks ends the run before it runs.
        before_tool_callback=before_tool_check if config.sign_in is not None else None,
        after_tool_callback=_make_after_tool(config) if config.after_tool else None,
    )


def resolve_executor(config: AgentAppConfig, mode: str):
    """The executor for a mode, behind lazy imports (deterministic never imports ADK)."""
    if mode == "deterministic":
        from a2ui_agent_kit.executor_deterministic import DeterministicAgentExecutor

        from a2ui_agent_kit.catalog_lines import catalog_lines

        return DeterministicAgentExecutor(
            config.build_response,
            config.build_text_response,
            config.sign_in,
            lines=catalog_lines(config),
        )
    if mode in ("stub", "live"):
        from a2ui_agent_kit.executor_llm import LlmAgentExecutor
        from a2ui_agent_kit.responder import AdkLlmResponder, PerAccountResponder

        if mode == "live" and isinstance(config.sign_in, SignIn):
            responder = PerAccountResponder(
                lambda account: AdkLlmResponder(
                    build_llm_agent(config, mode, account=account),
                    app_name=config.responder_app_name,
                )
            )
        else:
            responder = AdkLlmResponder(
                build_llm_agent(config, mode), app_name=config.responder_app_name
            )
        return LlmAgentExecutor(responder, config)
    raise ValueError(
        f"mode {mode!r} is not a known mode; expected 'deterministic', 'stub' or 'live'."
    )
