"""The kit's policy toolset with Gmail's one policy: pseudonymize before it can leave.

Task-2.6 decision 8 puts the substitution at the source. The first implementation used ADK's
`after_tool_callback`, and it leaked: `CallToolResult` carries both `content` and
`structuredContent`, the callback rewrote only the text parts, and the model read the
structured one. The captured corpus was clean while the painted stream was not.

The fix is not a wider callback — it is a lower boundary, which is exactly the seam the
kit's `PolicyMcpTool` exposes: `shape_result` runs on the dict the tool is about to return,
so the pseudonymized dict is the ONLY thing that exists downstream. There is no second copy
to read, which is the property the callback could never offer.

Nothing here is active outside record mode: `scrub_tool_result` returns its argument unchanged
when `A2UI_RECORD_DIR` is unset, so the live path is the stock ADK path.
"""

from __future__ import annotations

from typing import Any

from a2uiverse_kit.toolset import PolicyMcpTool, PolicyMcpToolset

from app.tool_shaping import scrub_tool_result


class RecordingMcpTool(PolicyMcpTool):
    """An McpTool that pseudonymizes its own result in record mode."""

    def shape_result(self, result: Any) -> Any:
        return scrub_tool_result(result, self.name)


class RecordingMcpToolset(PolicyMcpToolset):
    """An McpToolset whose tools are RecordingMcpTool."""

    tool_class = RecordingMcpTool
