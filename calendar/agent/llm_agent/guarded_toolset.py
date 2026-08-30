"""An McpToolset that guards what leaves the process and records what comes back.

Two duties, at the lowest boundary available -- `McpTool._run_async_impl`, which builds the
argument dict on the way out and the result dict on the way back.

**Outbound: two pins, in every run mode.**

`suppress_notifications` forces `notificationLevel` to `NONE` on every call before it leaves
(task-2.7 decision 2). Calendar's writes reach third parties, and the server treats an absent
notificationLevel as `ALL` — so omitting the argument is the loud choice, not the safe one.

`pin_calendar` forces `calendarId` to the seeded demo calendar. The API's default is the
user's `primary`, and nothing else in the stack stops the model naming it.

Neither is a record-mode concern; both are live-mode ones, which is exactly why they live
here rather than in a callback that only some paths take.

**Inbound: corpus capture, in record mode only.** `capture_tool_result` writes the payload the
model read to the corpus `scripts/derive_corpus.py` builds the stub fixtures from, and returns
the result untouched.

The reason both sit *here* rather than in ADK's `before_tool_callback` / `after_tool_callback`
is the lesson task 2.6 learned the hard way: `CallToolResult` carries the same payload twice,
in `content` and in `structuredContent`, and a callback that handles one leaves the other. At
this boundary there is only ever one dict. Gmail needed that property to keep a pseudonymizer
honest; Calendar has no pseudonymizer (task-2.7 decision 4) but the argument holds for
suppression, where a second copy of the args would be a second way to mail somebody.

Outside record mode the inbound half is a pass-through, so the read path is the stock ADK
path. The outbound half is never a pass-through.
"""

from __future__ import annotations

from typing import Any

from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_tool import McpTool

from llm_agent.tool_shaping import capture_tool_result, pin_calendar, suppress_notifications


class GuardedMcpTool(McpTool):
    """An McpTool confined to the demo calendar and unable to notify anyone."""

    def _accepted_args(self) -> set[str]:
        """The parameter names this tool actually declares, off its own MCP schema.

        Both pins are filtered through this. The server rejects an undeclared argument with a
        400, so a pin applied blind would break every tool that does not take it — which, for
        `notificationLevel`, is every read.
        """
        schema = getattr(getattr(self, "_mcp_tool", None), "inputSchema", None) or {}
        properties = schema.get("properties") if isinstance(schema, dict) else None
        return set(properties) if isinstance(properties, dict) else set()

    async def _run_async_impl(self, **kwargs: Any) -> Any:
        args = kwargs.get("args")
        if isinstance(args, dict):
            accepts = self._accepted_args()
            guarded = suppress_notifications(args, accepts)
            kwargs = {**kwargs, "args": pin_calendar(guarded, accepts)}
        result = await super()._run_async_impl(**kwargs)
        return capture_tool_result(result, self.name)


class GuardedMcpToolset(McpToolset):
    """An McpToolset whose tools are GuardedMcpTool.

    ADK builds its tools internally, so they are re-wrapped after the toolset has listed
    them. Re-wrapping rather than re-implementing keeps auth, filtering, retries and session
    management exactly as ADK does them — the only difference is the guard at the seam.
    """

    async def get_tools(self, readonly_context: Any = None) -> list[Any]:
        return [_as_guarded(tool) for tool in await super().get_tools(readonly_context)]


def _as_guarded(tool: Any) -> Any:
    """Re-classes an McpTool instance in place; leaves anything else alone."""
    if isinstance(tool, McpTool) and not isinstance(tool, GuardedMcpTool):
        tool.__class__ = GuardedMcpTool
    return tool
