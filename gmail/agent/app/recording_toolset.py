"""An McpToolset whose results are pseudonymized before they can leave the tool.

Task-2.6 decision 8 puts the substitution at the source. The first implementation used ADK's
`after_tool_callback`, and it leaked: `CallToolResult` carries both `content` and
`structuredContent`, the callback rewrote only the text parts, and the model read the
structured one. The captured corpus was clean while the painted stream was not.

The fix is not a wider callback — it is a lower boundary. `McpTool._run_async_impl` builds the
result dict and returns it; overriding that means the pseudonymized dict is the ONLY thing
that exists downstream. There is no second copy to read, which is the property the callback
could never offer.

Nothing here is active outside record mode: `scrub_tool_result` returns its argument unchanged
when `A2UI_RECORD_DIR` is unset, so the live path is the stock ADK path.
"""

from __future__ import annotations

from typing import Any

from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_tool import McpTool

from app.tool_shaping import scrub_tool_result


class RecordingMcpTool(McpTool):
    """An McpTool that pseudonymizes its own result in record mode."""

    async def _run_async_impl(self, **kwargs: Any) -> Any:
        result = await super()._run_async_impl(**kwargs)
        return scrub_tool_result(result, self.name)


class RecordingMcpToolset(McpToolset):
    """An McpToolset whose tools are RecordingMcpTool.

    ADK builds its tools internally, so they are re-wrapped after the toolset has listed
    them. Re-wrapping rather than re-implementing keeps auth, filtering, retries and session
    management exactly as ADK does them — the only difference is where the result is scrubbed.
    """

    async def get_tools(self, readonly_context: Any = None) -> list[Any]:
        return [_as_recording(tool) for tool in await super().get_tools(readonly_context)]


def _as_recording(tool: Any) -> Any:
    """Re-classes an McpTool instance in place; leaves anything else alone."""
    if isinstance(tool, McpTool) and not isinstance(tool, RecordingMcpTool):
        tool.__class__ = RecordingMcpTool
    return tool
