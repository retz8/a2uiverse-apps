"""The toolset-wrapper base: a per-call interception point on every MCP tool.

Standard agent anatomy (task-3.3 decision 1): every agent's live toolset is a
`PolicyMcpToolset`, whether or not it carries a policy today. An agent's policy —
what may leave the process, what the model may read — goes into the tool hooks:
`shape_args` on the way out, `shape_result` on the way back. The base hooks are
pass-throughs, so instantiating the toolset directly is the stock ADK behavior
with the interception point already in place.

The hooks live at `McpTool._run_async_impl` — the lowest boundary available —
rather than in ADK's `before_tool_callback`/`after_tool_callback`, because of the
lesson task 2.6 learned the hard way: `CallToolResult` carries the same payload
twice, in `content` and in `structuredContent`, and a callback that rewrites one
leaves the other for the model to read. At this boundary there is only ever one
dict, on the way out and on the way back.

ADK builds its tools internally, so they are re-wrapped after the toolset has
listed them. Re-wrapping rather than re-implementing keeps auth, filtering,
retries and session management exactly as ADK does them — the only difference is
the hooks at the seam.
"""

from __future__ import annotations

from typing import Any, ClassVar

from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_tool import McpTool


class PolicyMcpTool(McpTool):
    """An McpTool with pass-through policy hooks on both directions of a call."""

    def accepted_args(self) -> set[str]:
        """The parameter names this tool actually declares, off its own MCP schema.

        An outbound pin should be filtered through this: the server rejects an
        undeclared argument with a 400, so a pin applied blind breaks every tool
        that does not take it.
        """
        schema = getattr(getattr(self, "_mcp_tool", None), "inputSchema", None) or {}
        properties = schema.get("properties") if isinstance(schema, dict) else None
        return set(properties) if isinstance(properties, dict) else set()

    def shape_args(self, args: dict[str, Any]) -> dict[str, Any]:
        """Outbound hook: the argument dict about to leave the process."""
        return args

    def shape_result(self, result: Any) -> Any:
        """Inbound hook: the result dict the model is about to read."""
        return result

    async def _run_async_impl(self, **kwargs: Any) -> Any:
        args = kwargs.get("args")
        if isinstance(args, dict):
            kwargs = {**kwargs, "args": self.shape_args(args)}
        result = await super()._run_async_impl(**kwargs)
        return self.shape_result(result)


class PolicyMcpToolset(McpToolset):
    """An McpToolset whose tools are re-wrapped as `tool_class` after listing."""

    tool_class: ClassVar[type[PolicyMcpTool]] = PolicyMcpTool

    async def get_tools(self, readonly_context: Any = None) -> list[Any]:
        return [
            rewrap(tool, self.tool_class) for tool in await super().get_tools(readonly_context)
        ]


def rewrap(tool: Any, tool_class: type[PolicyMcpTool]) -> Any:
    """Re-classes an McpTool instance in place; leaves anything else alone."""
    if isinstance(tool, McpTool) and not isinstance(tool, tool_class):
        tool.__class__ = tool_class
    return tool
