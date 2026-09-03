"""The toolset-wrapper base: re-wrapping mechanics and the policy hook pair.

Everything here is offline: the base McpTool call is patched out, so the tests
exercise exactly the seam the kit adds — hooks around the call, re-classing after
listing — and nothing of ADK's own transport.
"""

from __future__ import annotations

from typing import Any
from unittest.mock import AsyncMock, MagicMock

import mcp.types as mcp_types
from google.adk.tools.mcp_tool import McpToolset, StreamableHTTPConnectionParams
from google.adk.tools.mcp_tool.mcp_tool import McpTool

from a2ui_agent_kit.toolset import PolicyMcpTool, PolicyMcpToolset, rewrap


def make_tool(name: str = "t", properties: dict | None = None) -> McpTool:
    schema = {"type": "object", "properties": properties if properties is not None else {}}
    return McpTool(
        mcp_tool=mcp_types.Tool(name=name, inputSchema=schema),
        mcp_session_manager=MagicMock(),
    )


class ArgPinningTool(PolicyMcpTool):
    def shape_args(self, args: dict[str, Any]) -> dict[str, Any]:
        return {**args, "pinned": True}


class ResultWrappingTool(PolicyMcpTool):
    def shape_result(self, result: Any) -> Any:
        return {"wrapped": result, "by": self.name}


class TestRewrap:
    def test_reclasses_an_mcp_tool_in_place(self):
        tool = make_tool()
        assert rewrap(tool, PolicyMcpTool) is tool
        assert isinstance(tool, PolicyMcpTool)

    def test_leaves_a_non_mcp_tool_alone(self):
        marker = object()
        assert rewrap(marker, PolicyMcpTool) is marker
        assert not isinstance(marker, PolicyMcpTool)

    def test_is_idempotent(self):
        tool = rewrap(make_tool(), ArgPinningTool)
        assert type(rewrap(tool, ArgPinningTool)) is ArgPinningTool


class TestAcceptedArgs:
    def test_reads_the_tools_own_schema(self):
        tool = rewrap(make_tool(properties={"a": {"type": "string"}, "b": {}}), PolicyMcpTool)
        assert tool.accepted_args() == {"a", "b"}

    def test_an_empty_schema_yields_an_empty_set(self):
        tool = rewrap(make_tool(), PolicyMcpTool)
        assert tool.accepted_args() == set()


class TestHooks:
    def _patch_base(self, monkeypatch, result: Any) -> AsyncMock:
        base = AsyncMock(return_value=result)
        monkeypatch.setattr(McpTool, "_run_async_impl", base)
        return base

    async def test_the_base_hooks_are_pass_throughs(self, monkeypatch):
        # Decision 1: an agent with no policy instantiates the base directly and
        # gets stock behavior — the interception point exists, and does nothing.
        base = self._patch_base(monkeypatch, {"content": []})
        tool = rewrap(make_tool(), PolicyMcpTool)
        out = await tool._run_async_impl(args={"a": 1}, tool_context=None, credential=None)
        assert out == {"content": []}
        assert base.call_args.kwargs["args"] == {"a": 1}

    async def test_shape_args_rewrites_what_leaves_the_process(self, monkeypatch):
        base = self._patch_base(monkeypatch, {})
        tool = rewrap(make_tool(), ArgPinningTool)
        await tool._run_async_impl(args={"a": 1}, tool_context=None, credential=None)
        assert base.call_args.kwargs["args"] == {"a": 1, "pinned": True}

    async def test_shape_result_rewrites_what_the_model_reads(self, monkeypatch):
        self._patch_base(monkeypatch, {"content": ["real"]})
        tool = rewrap(make_tool(name="lookup"), ResultWrappingTool)
        out = await tool._run_async_impl(args={}, tool_context=None, credential=None)
        assert out == {"wrapped": {"content": ["real"]}, "by": "lookup"}

    async def test_non_dict_args_skip_the_outbound_hook(self, monkeypatch):
        base = self._patch_base(monkeypatch, {})
        tool = rewrap(make_tool(), ArgPinningTool)
        await tool._run_async_impl(args=None, tool_context=None, credential=None)
        assert base.call_args.kwargs["args"] is None


class TestToolsetRewrapsAfterListing:
    def _toolset(self, cls: type[PolicyMcpToolset]) -> PolicyMcpToolset:
        return cls(
            connection_params=StreamableHTTPConnectionParams(url="http://localhost:1/mcp")
        )

    async def test_listed_tools_come_back_as_the_tool_class(self, monkeypatch):
        class PinningToolset(PolicyMcpToolset):
            tool_class = ArgPinningTool

        listed = [make_tool("a"), make_tool("b"), "not-a-tool"]
        monkeypatch.setattr(McpToolset, "get_tools", AsyncMock(return_value=listed))
        tools = await self._toolset(PinningToolset).get_tools()
        assert [type(t) for t in tools[:2]] == [ArgPinningTool, ArgPinningTool]
        assert tools[2] == "not-a-tool"

    async def test_the_default_tool_class_is_the_no_op_base(self, monkeypatch):
        monkeypatch.setattr(McpToolset, "get_tools", AsyncMock(return_value=[make_tool()]))
        (tool,) = await self._toolset(PolicyMcpToolset).get_tools()
        assert type(tool) is PolicyMcpTool
