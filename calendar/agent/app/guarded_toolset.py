"""The kit's policy toolset with Calendar's guard: pin what leaves, capture what returns.

**Outbound: two pins, in every run mode.**

`suppress_notifications` forces `notificationLevel` to `NONE` on every call before it leaves
(task-2.7 decision 2). Calendar's writes reach third parties, and the server treats an absent
notificationLevel as `ALL` — so omitting the argument is the loud choice, not the safe one.

`pin_calendar` forces `calendarId` to the seeded demo calendar. The API's default is the
user's `primary`, and nothing else in the stack stops the model naming it.

Both pins are filtered through the tool's own declared parameters (the kit base's
`accepted_args`): the server rejects an undeclared argument with a 400, so a pin applied
blind would break every tool that does not take it — which, for `notificationLevel`, is
every read.

**Inbound: corpus capture, in record mode only.** `capture_tool_result` writes the payload
the model read to the corpus `scripts/derive_corpus.py` builds the stub fixtures from, and
returns the result untouched.

Both duties sit on the kit's `PolicyMcpTool` hooks — the lowest boundary available — for the
lesson task 2.6 learned the hard way: `CallToolResult` carries the same payload twice, in
`content` and in `structuredContent`, and a callback that handles one leaves the other. At
this boundary there is only ever one dict. Gmail needed that property to keep a pseudonymizer
honest; Calendar has no pseudonymizer (task-2.7 decision 4) but the argument holds for
suppression, where a second copy of the args would be a second way to mail somebody.

Outside record mode the inbound half is a pass-through, so the read path is the stock ADK
path. The outbound half is never a pass-through.
"""

from __future__ import annotations

from typing import Any

from a2uiverse_kit.toolset import PolicyMcpTool, PolicyMcpToolset

from app.tool_shaping import capture_tool_result, pin_calendar, suppress_notifications


class GuardedMcpTool(PolicyMcpTool):
    """An McpTool confined to the demo calendar and unable to notify anyone."""

    def shape_args(self, args: dict[str, Any]) -> dict[str, Any]:
        accepts = self.accepted_args()
        return pin_calendar(suppress_notifications(args, accepts), accepts)

    def shape_result(self, result: Any) -> Any:
        return capture_tool_result(result, self.name)


class GuardedMcpToolset(PolicyMcpToolset):
    """An McpToolset whose tools are GuardedMcpTool."""

    tool_class = GuardedMcpTool
