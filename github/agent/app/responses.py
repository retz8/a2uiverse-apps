"""Maps an incoming A2UI action to a canned A2UI response, echoing the surfaceId."""

from __future__ import annotations

from itertools import count
from pathlib import Path

from a2ui_agent_kit.responses import fallback, load_fixture, stamp_surface

_FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures" / "deterministic"
_EVENT_FIXTURES = {
    "submit": "submit.json",
    "approve": "approve.json",
    "token-remove": "token-remove.json",
    "issue-label-remove": "issue-label-remove.json",
    "select": "select.json",
    "toggle": "toggle.json",
    "search": "search.json",
    "pin": "pin.json",
    "remove": "remove.json",
    "save": "save.json",
    "copy": "copy.json",
    "select-item": "select-item.json",
    "delete": "delete.json",
    "retry-subtree": "retry-subtree.json",
    "dialog-close": "dialog-close.json",
    "popover-dismiss": "popover-dismiss.json",
    "confirm-delete": "confirm-delete.json",
    "save-changes": "save-changes.json",
    "cd-confirm-delete": "cd-confirm-delete.json",
    "cd-cancel-delete": "cd-cancel-delete.json",
    "panel-open": "panel-open.json",
    "panel-close": "panel-close.json",
    "panel-toggle": "panel-toggle.json",
    "create-label": "create-label.json",
}

# Demo view labels for the SegmentedControl `change` event: segment indices → names in the
# `segmentedcontrol-event` fixture. The `change` response is built dynamically from the event's
# `context.selectedIndex` (not a canned fixture) so the demo reflects the actually-selected segment.
_VIEW_NAMES = ("Preview", "Raw", "Blame")


def _change_response(action: dict, surface_id: str) -> list[dict]:
    index = action.get("context", {}).get("selectedIndex", 0)
    name = (
        _VIEW_NAMES[index]
        if isinstance(index, int) and 0 <= index < len(_VIEW_NAMES)
        else f"index {index}"
    )
    return [
        {
            "version": "v0.9",
            "updateDataModel": {"surfaceId": surface_id, "path": "/view", "value": index},
        },
        {
            "version": "v0.9",
            "updateComponents": {
                "surfaceId": surface_id,
                "components": [
                    {
                        "id": "status",
                        "component": "Text",
                        "text": f"✅ Now showing: {name} — server received index {index}",
                    }
                ],
            },
        },
    ]


def _select_assigned_response(action: dict, surface_id: str) -> list[dict]:
    """ActionList.Item `select`: echo the item's optimistic `context.assigned` write, then confirm.

    The `select` event name is shared with the Radio/Select `select.json` fixture, but the
    ActionList.Item variant echoes the received selection dynamically (like `change` echoes
    `selectedIndex`), so it is built here rather than from a static fixture. Dispatch is keyed on
    the presence of `context.assigned`, which only the ActionList item event carries; the Radio
    `select` (context `{value}`) still falls through to `select.json`.
    """
    assigned = action.get("context", {}).get("assigned", False)
    return [
        {
            "version": "v0.9",
            "updateDataModel": {"surfaceId": surface_id, "path": "/assigned", "value": assigned},
        },
        {
            "version": "v0.9",
            "updateComponents": {
                "surfaceId": surface_id,
                "components": [
                    {
                        "id": "status",
                        "component": "Text",
                        "text": "✅ Assigned to you — server confirmed",
                    }
                ],
            },
        },
    ]


def _label_select_response(action: dict, surface_id: str) -> list[dict]:
    """SelectPanel.Item `label-select`: echo the item's optimistic `context.selected` write, then
    swap the always-rendered trigger label.

    Built dynamically (like `change` / the ActionList `select`) so the response reflects the actual
    selection carried by the item's optimistic two-way write before the event fires. The `/sel/bug`
    echo is visible through the item's `selected <- /sel/bug` coupling (the checkmark follows the
    data model); the `anchor-label` swap is self-visible in both the open and closed panel states.
    """
    selected = action.get("context", {}).get("selected", False)
    return [
        {
            "version": "v0.9",
            "updateDataModel": {"surfaceId": surface_id, "path": "/sel/bug", "value": selected},
        },
        {
            "version": "v0.9",
            "updateComponents": {
                "surfaceId": surface_id,
                "components": [
                    {"id": "anchor-label", "component": "Text", "text": "✅ bug applied"}
                ],
            },
        },
    ]


# The playing machinery is the kit's; the dispatch below is this agent's policy.
def _load_fixture(name: str) -> list[dict]:
    return load_fixture(_FIXTURES_DIR, name)


_stamp_surface = stamp_surface
_fallback = fallback


def build_response(action: dict) -> list[dict]:
    name = action.get("name", "")
    surface_id = action.get("surfaceId", "")
    if name == "change":
        return _change_response(action, surface_id)
    if name == "select" and not action.get("context"):
        # RadioGroup `select` (empty context): the group's runtime "which radio" value cannot be
        # captured statically, so the event honestly signals only "selection changed". Acknowledge
        # and lock the group (write /locked=true, swap the status Text). Keyed on empty context,
        # which distinguishes it from the Radio (`{value}`), ActionList.Item (`{assigned}`), and
        # UnderlineNav.Item (`{tab}`) `select` variants — all of which carry a non-empty context.
        return _stamp_surface(_load_fixture("radiogroup-select.json"), surface_id)
    if name == "select" and "assigned" in action.get("context", {}):
        return _select_assigned_response(action, surface_id)
    if name == "label-select":
        return _label_select_response(action, surface_id)
    if name == "select" and "tab" in action.get("context", {}):
        # UnderlineNav.Item `select` (context `{tab}`): confirm the selection and refresh the
        # selected tab's count. Shares the `select` event name with the Radio (context `{value}`)
        # and ActionList.Item (context `{assigned}`) variants; keyed on `tab`, which only this event
        # carries. The response is fully canned (targets `tab-pulls`), so it loads a static fixture.
        return _stamp_surface(_load_fixture("underline-nav-select.json"), surface_id)
    fixture = _EVENT_FIXTURES.get(name)
    if fixture is None:
        return _fallback(name, surface_id)
    return _stamp_surface(_load_fixture(fixture), surface_id)


# Each text prompt creates its own surface (notifications-1, notifications-2, ...): a surfaceId
# may not be re-created on the client, and the stateless executor cannot know what already
# exists, so fresh ids keep every turn renderable.
_text_counter = count(1)


def build_text_response(text: str) -> list[dict]:
    """The recorded today digest, on a fresh surface.

    Task 5.6: this used to be a hand-authored echo-and-acknowledge surface carried over from
    the chat shell this agent was forked from — which left GitHub the one agent whose
    `deterministic` mode was not the composition harness its siblings are, so a composed screen
    driven with no model got two real vendor shapes and an echo. It now plays the digest
    derived from a live run, like Gmail and Calendar.

    The text path does not route: whatever it is asked, it answers with the canned digest —
    discriminating on the utterance would be a second, worse router, and the live modes are
    where intent is read.
    """
    messages = _load_fixture("notifications.json")
    return _stamp_surface(messages, f"notifications-{next(_text_counter)}")
