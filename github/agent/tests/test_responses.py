from deterministic_agent.responses import build_response

SUBMIT = {"name": "submit", "surfaceId": "button-event", "sourceComponentId": "root", "context": {}}
SELECT = {
    "name": "select",
    "surfaceId": "radio-event",
    "sourceComponentId": "root",
    "context": {"value": "option-1"},
}


def test_submit_returns_data_model_then_components_with_surface_echoed():
    msgs = build_response(SUBMIT)
    assert len(msgs) == 2

    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "button-event"
    assert dm["path"] == "/submitted"
    assert dm["value"] is True

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "button-event"
    assert uc["components"] == [
        {"id": "label", "component": "Text", "text": "✅ Sent — server received submit"}
    ]


TOKEN_REMOVE = {
    "name": "token-remove",
    "surfaceId": "token-remove-event",
    "sourceComponentId": "root",
    "context": {},
}
ISSUE_LABEL_REMOVE = {
    "name": "issue-label-remove",
    "surfaceId": "issuelabeltoken-remove-event",
    "sourceComponentId": "root",
    "context": {},
}
TOGGLE = {
    "name": "toggle",
    "surfaceId": "toggleswitch-event",
    "sourceComponentId": "root",
    "context": {"checked": True},
}


def test_token_remove_returns_data_model_then_status_swap_with_surface_echoed():
    msgs = build_response(TOKEN_REMOVE)
    assert len(msgs) == 2

    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "token-remove-event"
    assert dm["path"] == "/removed"
    assert dm["value"] is True

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "token-remove-event"
    assert uc["components"] == [
        {"id": "status", "component": "Text", "text": "✅ Removed — server received token-remove"}
    ]


def test_issue_label_remove_returns_data_model_then_status_swap_with_surface_echoed():
    msgs = build_response(ISSUE_LABEL_REMOVE)
    assert len(msgs) == 2

    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "issuelabeltoken-remove-event"
    assert dm["path"] == "/removed"
    assert dm["value"] is True

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "issuelabeltoken-remove-event"
    assert uc["components"] == [
        {
            "id": "status",
            "component": "Text",
            "text": "✅ Removed — server received issue-label-remove",
        }
    ]


def test_select_returns_data_model_then_components_with_surface_echoed():
    msgs = build_response(SELECT)
    assert len(msgs) == 2

    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "radio-event"
    assert dm["path"] == "/selected"
    assert dm["value"] is True

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "radio-event"
    assert uc["components"] == [
        {"id": "status", "component": "Text", "text": '✅ Selected — server received "option-1"'}
    ]


def test_toggle_reverts_setting_then_swaps_status_with_surface_echoed():
    msgs = build_response(TOGGLE)
    assert len(msgs) == 2

    # The server stays authoritative over the two-way-bound path: it writes /setting back to
    # false, overriding the optimistic local flip.
    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "toggleswitch-event"
    assert dm["path"] == "/setting"
    assert dm["value"] is False

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "toggleswitch-event"
    assert uc["components"] == [
        {
            "id": "status",
            "component": "Text",
            "text": "⚠️ Could not save — reverted by server",
        }
    ]


APPROVE = {
    "name": "approve",
    "surfaceId": "iconbutton-event",
    "sourceComponentId": "root",
    "context": {},
}


def test_approve_writes_approved_then_swaps_icon_with_surface_echoed():
    msgs = build_response(APPROVE)
    assert len(msgs) == 2

    # The /approved write is visible only through the button's `disabled <- /approved` binding —
    # after approve the button locks, proving two-way binding on the button itself.
    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "iconbutton-event"
    assert dm["path"] == "/approved"
    assert dm["value"] is True

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "iconbutton-event"
    assert uc["components"] == [
        {"id": "approve-icon", "component": "Icon", "name": "check-circle-fill"}
    ]


def _change(index: int) -> dict:
    return {
        "name": "change",
        "surfaceId": "segmentedcontrol-event",
        "sourceComponentId": "control",
        "context": {"selectedIndex": index},
    }


def test_change_echoes_the_selected_index_and_names_the_view_with_surface_echoed():
    # index 2 -> Blame. The /view echo is visible through the `selectedIndex <- /view` coupling.
    msgs = build_response(_change(2))
    assert len(msgs) == 2

    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "segmentedcontrol-event"
    assert dm["path"] == "/view"
    assert dm["value"] == 2

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "segmentedcontrol-event"
    assert uc["components"] == [
        {
            "id": "status",
            "component": "Text",
            "text": "✅ Now showing: Blame — server received index 2",
        }
    ]


def test_change_reflects_a_different_index_not_a_canned_value():
    # index 1 -> Raw. Proves the response echoes `context.selectedIndex` rather than a fixed 2/Blame.
    msgs = build_response(_change(1))
    assert msgs[0]["updateDataModel"]["value"] == 1
    assert msgs[1]["updateComponents"]["components"][0]["text"] == (
        "✅ Now showing: Raw — server received index 1"
    )


SEARCH = {
    "name": "search",
    "surfaceId": "textinput-action-event",
    "sourceComponentId": "search-action",
    "context": {"query": "octocat"},
}


def test_search_writes_validation_then_swaps_result_with_surface_echoed():
    msgs = build_response(SEARCH)
    assert len(msgs) == 2

    # The /validation write is visible through the parent TextInput's validationStatus coupling
    # (the field turns green), proving two-way data binding on the input.
    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "textinput-action-event"
    assert dm["path"] == "/validation"
    assert dm["value"] == "success"

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "textinput-action-event"
    assert uc["components"] == [
        {"id": "result", "component": "Text", "text": 'Found 3 repositories for "octocat"'}
    ]


PIN = {
    "name": "pin",
    "surfaceId": "navlist-trailingaction-event",
    "sourceComponentId": "ta",
    "context": {},
}
SAVE = {
    "name": "save",
    "surfaceId": "action-bar-icon-button-event",
    "sourceComponentId": "root",
    "context": {},
}
COPY = {
    "name": "copy",
    "surfaceId": "action-bar-menu",
    "sourceComponentId": "menu",
    "context": {},
}
SELECT_ITEM = {
    "name": "select-item",
    "surfaceId": "tree-view-item-event",
    "sourceComponentId": "item-src",
    "context": {"id": "src"},
}


def test_select_item_writes_item_selected_then_swaps_label_with_surface_echoed():
    msgs = build_response(SELECT_ITEM)
    assert len(msgs) == 2

    # The /itemSelected write is visible through the item's `current <- /itemSelected` binding —
    # after select the row highlights as current, proving two-way binding on the item.
    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "tree-view-item-event"
    assert dm["path"] == "/itemSelected"
    assert dm["value"] is True

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "tree-view-item-event"
    assert uc["components"] == [
        {"id": "label-src", "component": "Text", "text": "✅ src selected"}
    ]


DELETE = {
    "name": "delete",
    "surfaceId": "tree-view-item-secondary-actions",
    "sourceComponentId": "item-src",
    "context": {},
}


def test_pin_writes_pin_status_then_swaps_icon_with_surface_echoed():
    msgs = build_response(PIN)
    assert len(msgs) == 2

    # The /pinStatus write is visible only through the sibling `status` Text's `text <- /pinStatus`
    # binding — the half that proves two-way data binding.
    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "navlist-trailingaction-event"
    assert dm["path"] == "/pinStatus"
    assert dm["value"] == "📌 Pinned — server confirmed"

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "navlist-trailingaction-event"
    assert uc["components"] == [
        {"id": "pin-icon", "component": "Icon", "name": "check-circle-fill"}
    ]


# --- ActionList family (6.38) ---

ACTIONLIST_SELECT = {
    "name": "select",
    "surfaceId": "actionlist-item-event",
    "sourceComponentId": "a0",
    "context": {"assigned": True},
}
ACTIONLIST_REMOVE = {
    "name": "remove",
    "surfaceId": "actionlist-trailingaction-event",
    "sourceComponentId": "labelrow-ta",
    "context": {"label": "bug"},
}


def test_actionlist_select_echoes_assigned_then_swaps_status_with_surface_echoed():
    # The ActionList.Item `select` echoes the item's optimistic `context.assigned` write
    # dynamically (distinct from the Radio `select` static fixture, keyed on `assigned`). The
    # /assigned echo is visible through the item's `selected <- /assigned` coupling.
    msgs = build_response(ACTIONLIST_SELECT)
    assert len(msgs) == 2

    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "actionlist-item-event"
    assert dm["path"] == "/assigned"
    assert dm["value"] is True

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "actionlist-item-event"
    assert uc["components"] == [
        {"id": "status", "component": "Text", "text": "✅ Assigned to you — server confirmed"}
    ]


def test_actionlist_select_echoes_a_false_assignment_not_a_canned_value():
    # Proves the response echoes `context.assigned` rather than a fixed True.
    msgs = build_response({**ACTIONLIST_SELECT, "context": {"assigned": False}})
    assert msgs[0]["updateDataModel"]["value"] is False


def test_radio_select_still_falls_through_to_the_static_fixture():
    # The Radio `select` (context `{value}`, no `assigned`) must not be captured by the
    # ActionList dynamic branch — it still returns the static select.json (writes /selected).
    msgs = build_response(SELECT)
    assert msgs[0]["updateDataModel"]["path"] == "/selected"


# --- UnderlineNav family (6.43) ---

UNDERLINE_NAV_SELECT = {
    "name": "select",
    "surfaceId": "underline-nav-item-event",
    "sourceComponentId": "tab-pulls",
    "context": {"tab": "pulls"},
}


def test_underline_nav_select_refreshes_the_count_then_marks_the_tab_current_with_surface_echoed():
    # The UnderlineNav.Item `select` (context `{tab}`) confirms the selection: it writes the tab's
    # refreshed count and re-emits `tab-pulls` as the current tab. The /pullsCount write is visible
    # through the item's `counter <- /pullsCount` coupling (4 -> 5).
    msgs = build_response(UNDERLINE_NAV_SELECT)
    assert len(msgs) == 2

    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "underline-nav-item-event"
    assert dm["path"] == "/pullsCount"
    assert dm["value"] == "5"

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "underline-nav-item-event"
    assert uc["components"] == [
        {
            "id": "tab-pulls",
            "component": "UnderlineNav.Item",
            "text": "Pull requests",
            "aria-current": "page",
            "counter": {"path": "/pullsCount"},
            "href": "#/pulls",
            "action": {"event": {"name": "select", "context": {"tab": "pulls"}}},
        }
    ]


def test_radio_select_not_captured_by_the_underline_nav_tab_branch():
    # The Radio `select` (context `{value}`, no `tab`) still returns the static select.json.
    msgs = build_response(SELECT)
    assert msgs[0]["updateDataModel"]["path"] == "/selected"


def test_actionlist_remove_writes_removed_then_swaps_status_with_surface_echoed():
    # TrailingAction carries no two-way state; /removed is written only by the server. The write
    # is visible through the neighboring `Item.disabled <- /removed` coupling (the row greys out).
    msgs = build_response(ACTIONLIST_REMOVE)
    assert len(msgs) == 2

    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "actionlist-trailingaction-event"
    assert dm["path"] == "/removed"
    assert dm["value"] is True

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "actionlist-trailingaction-event"
    assert uc["components"] == [
        {"id": "status", "component": "Text", "text": '🗑️ Removed "bug" — server confirmed'}
    ]


def test_save_writes_saved_then_swaps_icon_with_surface_echoed():
    msgs = build_response(SAVE)
    assert len(msgs) == 2

    # The /saved write is visible only through the button's `disabled <- /saved` binding — after
    # saving the button locks (preventing re-submit), proving two-way binding on the button itself.
    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "action-bar-icon-button-event"
    assert dm["path"] == "/saved"
    assert dm["value"] is True

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "action-bar-icon-button-event"
    assert uc["components"] == [{"id": "save-icon", "component": "Icon", "name": "check"}]


def test_copy_writes_status_then_swaps_menu_icon_with_surface_echoed():
    msgs = build_response(COPY)
    assert len(msgs) == 2

    # The /status write is visible through the companion Text `text <- /status`, proving two-way
    # data binding for the menu (whose `items` are authored config, not bindable state).
    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "action-bar-menu"
    assert dm["path"] == "/status"
    assert dm["value"] == "Copied to clipboard"

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "action-bar-menu"
    assert uc["components"] == [{"id": "menu-icon", "component": "Icon", "name": "check"}]


def test_delete_writes_row_deleted_then_swaps_label_with_surface_echoed():
    msgs = build_response(DELETE)
    assert len(msgs) == 2

    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "tree-view-item-secondary-actions"
    assert dm["path"] == "/rowDeleted"
    assert dm["value"] is True

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "tree-view-item-secondary-actions"
    assert uc["components"] == [{"id": "label-src", "component": "Text", "text": "🗑 Deleted"}]


RETRY_SUBTREE = {
    "name": "retry-subtree",
    "surfaceId": "tree-view-error-dialog",
    "sourceComponentId": "error-dialog",
    "context": {},
}


def test_retry_subtree_writes_message_then_swaps_subtree_to_loading_with_surface_echoed():
    msgs = build_response(RETRY_SUBTREE)
    assert len(msgs) == 2

    # The /retryMessage write is visible through the dialog body `Text.text <- /retryMessage`
    # coupling; the error->loading SubTree swap is the self-visible reaction.
    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "tree-view-error-dialog"
    assert dm["path"] == "/retryMessage"
    assert dm["value"] == "Retrying…"

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "tree-view-error-dialog"
    assert uc["components"] == [
        {"id": "subtree-src", "component": "TreeViewSubTree", "state": "loading", "count": 3}
    ]


DIALOG_CLOSE = {
    "name": "dialog-close",
    "surfaceId": "dialog-close-event",
    "sourceComponentId": "root",
    "context": {},
}


def test_dialog_close_acknowledges_dismissal_reopens_then_swaps_body_with_surface_echoed():
    msgs = build_response(DIALOG_CLOSE)
    assert len(msgs) == 3

    # The /closeStatus write is visible through the dialog `subtitle <- /closeStatus` coupling;
    # the body Text swap is the self-visible reaction.
    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "dialog-close-event"
    assert dm["path"] == "/closeStatus"
    assert dm["value"] == "✅ Close received — server acknowledged the dismissal"

    # The dismissal wrote /dialogOpen false (the `open` two-way binding); the agent reopens the
    # dialog by writing it back to true so the acknowledgement is visible.
    reopen = msgs[1]["updateDataModel"]
    assert reopen["surfaceId"] == "dialog-close-event"
    assert reopen["path"] == "/dialogOpen"
    assert reopen["value"] is True

    uc = msgs[2]["updateComponents"]
    assert uc["surfaceId"] == "dialog-close-event"
    assert uc["components"] == [
        {
            "id": "dialog-body",
            "component": "Text",
            "text": "The server has logged this dialog as dismissed.",
        }
    ]


CONFIRM_DELETE = {
    "name": "confirm-delete",
    "surfaceId": "dialog-buttons",
    "sourceComponentId": "root",
    "context": {},
}


def test_confirm_delete_disables_the_danger_button_then_swaps_body_with_surface_echoed():
    msgs = build_response(CONFIRM_DELETE)
    assert len(msgs) == 2

    # The /deleted write disables the danger button (`disabled <- /deleted`), so the action cannot
    # be repeated; the body Text swap is the self-visible reaction.
    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "dialog-buttons"
    assert dm["path"] == "/deleted"
    assert dm["value"] is True

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "dialog-buttons"
    assert uc["components"] == [
        {
            "id": "dialog-body",
            "component": "Text",
            "text": "🗑️ Deleted — server received confirm-delete",
        }
    ]


SAVE_CHANGES = {
    "name": "save-changes",
    "surfaceId": "dialog-slots",
    "sourceComponentId": "slots-buttons",
    "context": {},
}


def test_save_changes_writes_title_through_the_slot_subtree_then_swaps_body_with_surface_echoed():
    msgs = build_response(SAVE_CHANGES)
    assert len(msgs) == 2

    # The /dialog/title write resolves through the slot-composed subtree (root -> DialogHeader ->
    # DialogTitle `text <- /dialog/title`) — data binding at depth; the DialogBody Text swap is the
    # self-visible half.
    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "dialog-slots"
    assert dm["path"] == "/dialog/title"
    assert dm["value"] == "✅ Settings saved"

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "dialog-slots"
    assert uc["components"] == [
        {
            "id": "slots-body-text",
            "component": "Text",
            "text": "The server saved your changes — you can close this dialog.",
        }
    ]


CD_CONFIRM_DELETE = {
    "name": "cd-confirm-delete",
    "surfaceId": "confirmation-dialog-event",
    "sourceComponentId": "root",
    "context": {},
}
PANEL_OPEN = {
    "name": "panel-open",
    "surfaceId": "anchored-overlay-actions-event",
    "sourceComponentId": "root",
    "context": {},
}
PANEL_CLOSE = {
    "name": "panel-close",
    "surfaceId": "anchored-overlay-actions-event",
    "sourceComponentId": "root",
    "context": {},
}


POPOVER_DISMISS = {
    "name": "popover-dismiss",
    "surfaceId": "content-clickoutside-event",
    "sourceComponentId": "popover-content",
    "context": {},
}


def test_cd_confirm_delete_enters_loading_then_swaps_body_with_surface_echoed():
    msgs = build_response(CD_CONFIRM_DELETE)
    assert len(msgs) == 2

    # The /cd/deleting write drives the confirm button's loading state
    # (`confirmButtonLoading <- /cd/deleting`); the cd-body Text swap is the self-visible reaction.
    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "confirmation-dialog-event"
    assert dm["path"] == "/cd/deleting"
    assert dm["value"] is True

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "confirmation-dialog-event"
    assert uc["components"] == [
        {
            "id": "cd-body",
            "component": "Text",
            "text": "🗑️ Deleting branch — server received confirm",
        }
    ]


def test_panel_open_loads_options_then_swaps_status_with_surface_echoed():
    msgs = build_response(PANEL_OPEN)
    assert len(msgs) == 2

    # The /panel/message write is visible through the bound `panel-message` Text
    # (`text <- /panel/message`) inside the open panel — the binding-proof half.
    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "anchored-overlay-actions-event"
    assert dm["path"] == "/panel/message"
    assert dm["value"] == "Loaded 3 items from server"

    # The panel-status swap is the self-visible reaction, also landing inside the open panel.
    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "anchored-overlay-actions-event"
    assert uc["components"] == [
        {
            "id": "panel-status",
            "component": "Text",
            "text": "✅ Options loaded — server acknowledged",
        }
    ]


CREATE_LABEL = {
    "name": "create-label",
    "surfaceId": "autocomplete-addnew-event",
    "sourceComponentId": "menu",
    "context": {},
}


def test_create_label_confirms_selects_then_swaps_status_with_surface_echoed():
    msgs = build_response(CREATE_LABEL)
    assert len(msgs) == 3

    # 1. The /add/message confirmation, visible through the bound `add-message` Text
    # (`text <- /add/message`) — the binding-proof half.
    dm1 = msgs[0]["updateDataModel"]
    assert dm1["surfaceId"] == "autocomplete-addnew-event"
    assert dm1["path"] == "/add/message"
    assert dm1["value"] == 'Label "wontfix" created'

    # 2. /selected selects the newly created value — proving the two-way selectedItemIds binding.
    dm2 = msgs[1]["updateDataModel"]
    assert dm2["surfaceId"] == "autocomplete-addnew-event"
    assert dm2["path"] == "/selected"
    assert dm2["value"] == ["wontfix"]

    # 3. The add-status swap is the self-visible reaction.
    uc = msgs[2]["updateComponents"]
    assert uc["surfaceId"] == "autocomplete-addnew-event"
    assert uc["components"] == [
        {
            "id": "add-status",
            "component": "Text",
            "text": "✅ Server added the label",
        }
    ]


CD_CANCEL_DELETE = {
    "name": "cd-cancel-delete",
    "surfaceId": "confirmation-dialog-event",
    "sourceComponentId": "root",
    "context": {},
}


def test_cd_cancel_delete_updates_the_title_then_swaps_body_with_surface_echoed():
    msgs = build_response(CD_CANCEL_DELETE)
    assert len(msgs) == 2

    # The /cd/title write updates the heading (`title <- /cd/title`); the cd-body Text swap is the
    # self-visible reaction. Distinct from confirm so the round-trip separates confirm from cancel.
    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "confirmation-dialog-event"
    assert dm["path"] == "/cd/title"
    assert dm["value"] == "✅ Branch kept"

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "confirmation-dialog-event"
    assert uc["components"] == [
        {
            "id": "cd-body",
            "component": "Text",
            "text": "No changes made — server received cancel",
        }
    ]


def test_popover_dismiss_acknowledges_and_stays_open_with_surface_echoed():
    msgs = build_response(POPOVER_DISMISS)
    assert len(msgs) == 2

    # The /dismissNote write is visible through `Text#popover-message` `text <- /dismissNote`
    # (the two-way data-binding half); the heading swap is the self-visible half. The response is a
    # partial update only — no re-createSurface — so the popover stays open (acknowledge-and-stay).
    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "content-clickoutside-event"
    assert dm["path"] == "/dismissNote"
    assert dm["value"] == "Server acknowledged the dismissal."

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "content-clickoutside-event"
    assert uc["components"] == [
        {"id": "popover-heading", "component": "Heading", "text": "✅ Dismissed"}
    ]


def test_panel_close_writes_the_trigger_label_only_with_surface_echoed():
    # The panel is hidden when panel-close fires, so the only visible surface is the trigger: the
    # single write targets the trigger's bound `anchor-label` (`text <- /anchor/label`). No
    # component swap — the closed-visibility constraint (no distinct visible target when closed).
    msgs = build_response(PANEL_CLOSE)
    assert len(msgs) == 1

    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "anchored-overlay-actions-event"
    assert dm["path"] == "/anchor/label"
    assert dm["value"] == "Filter: 3 active"


# --- SelectPanel family (6.50) ---

PANEL_TOGGLE = {
    "name": "panel-toggle",
    "surfaceId": "selectpanel-onopenchange-event",
    "sourceComponentId": "root",
    "context": {},
}
LABEL_SELECT = {
    "name": "label-select",
    "surfaceId": "selectpanel-item-event",
    "sourceComponentId": "root",
    "context": {"selected": True},
}


def test_panel_toggle_writes_panel_title_then_swaps_trigger_label_with_surface_echoed():
    # onOpenChange fires on both open and close, so one authored response works in both states: it
    # writes the in-panel `title <- /panel/title` (visible when open, the binding-proof half) and
    # swaps the always-rendered trigger `anchor-label` (self-visible in both states).
    msgs = build_response(PANEL_TOGGLE)
    assert len(msgs) == 2

    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "selectpanel-onopenchange-event"
    assert dm["path"] == "/panel/title"
    assert dm["value"] == "Apply labels — 12 available"

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "selectpanel-onopenchange-event"
    assert uc["components"] == [{"id": "anchor-label", "component": "Text", "text": "Labels ▾"}]


def test_label_select_echoes_selected_then_swaps_trigger_label_with_surface_echoed():
    # SelectPanel.Item `label-select` echoes the item's optimistic `context.selected` write
    # dynamically. The /sel/bug echo is visible through the item's `selected <- /sel/bug` coupling.
    msgs = build_response(LABEL_SELECT)
    assert len(msgs) == 2

    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "selectpanel-item-event"
    assert dm["path"] == "/sel/bug"
    assert dm["value"] is True

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "selectpanel-item-event"
    assert uc["components"] == [{"id": "anchor-label", "component": "Text", "text": "✅ bug applied"}]


def test_label_select_echoes_a_false_selection_not_a_canned_value():
    # Proves the response echoes `context.selected` rather than a fixed True.
    msgs = build_response({**LABEL_SELECT, "context": {"selected": False}})
    assert msgs[0]["updateDataModel"]["value"] is False
# --- RadioGroup family (6.49) ---

RADIOGROUP_SELECT = {
    "name": "select",
    "surfaceId": "radiogroup-event",
    "sourceComponentId": "group",
    "context": {},
}


def test_radiogroup_select_locks_the_group_then_swaps_status_with_surface_echoed():
    # The RadioGroup `select` (empty context) acknowledges + locks: it writes /locked=true and swaps
    # the status Text. The /locked write is visible through the group's `disabled <- /locked`
    # coupling (the two-way binding proof on the group itself).
    msgs = build_response(RADIOGROUP_SELECT)
    assert len(msgs) == 2

    dm = msgs[0]["updateDataModel"]
    assert dm["surfaceId"] == "radiogroup-event"
    assert dm["path"] == "/locked"
    assert dm["value"] is True

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == "radiogroup-event"
    assert uc["components"] == [
        {"id": "status", "component": "Text", "text": "✅ Selection received"}
    ]


def test_radio_select_with_value_not_captured_by_the_radiogroup_empty_context_branch():
    # The Radio `select` (context `{value}`, non-empty) must not be captured by the RadioGroup
    # empty-context branch — it still returns the static select.json (writes /selected).
    msgs = build_response(SELECT)
    assert msgs[0]["updateDataModel"]["path"] == "/selected"


def test_unknown_event_returns_single_text_fallback_with_surface_echoed():
    msgs = build_response({"name": "wat", "surfaceId": "s9", "context": {}})
    assert len(msgs) == 1
    uc = msgs[0]["updateComponents"]
    assert uc["surfaceId"] == "s9"
    assert uc["components"][0]["component"] == "Text"
    assert uc["components"][0]["text"] == "Unhandled event: wat"


def test_text_prompt_returns_fresh_chat_surface_echoing_the_prompt():
    from deterministic_agent.catalog import get_catalog
    from deterministic_agent.responses import build_text_response

    msgs = build_text_response("show me open PRs")
    assert len(msgs) == 3

    cs = msgs[0]["createSurface"]
    assert cs["surfaceId"].startswith("chat-")
    assert cs["catalogId"] == get_catalog().catalog_id

    uc = msgs[1]["updateComponents"]
    assert uc["surfaceId"] == cs["surfaceId"]
    assert uc["components"] == [
        {
            "id": "root",
            "component": "Stack",
            "direction": "vertical",
            "gap": "normal",
            "children": ["echo", "ack"],
        },
        {
            "id": "echo",
            "component": "Text",
            "text": '✅ Deterministic agent received: "show me open PRs"',
        },
        {
            "id": "ack",
            "component": "Button",
            "child": "label",
            "variant": "primary",
            "disabled": {"path": "/submitted"},
            "action": {"event": {"name": "submit", "context": {}}},
        },
        {"id": "label", "component": "Text", "text": "Acknowledge"},
    ]

    dm = msgs[2]["updateDataModel"]
    assert dm["surfaceId"] == cs["surfaceId"]
    assert dm["path"] == "/"
    assert dm["value"] == {"submitted": False}


def test_each_text_prompt_gets_its_own_surface():
    from deterministic_agent.responses import build_text_response

    first = build_text_response("one")[0]["createSurface"]["surfaceId"]
    second = build_text_response("one")[0]["createSurface"]["surfaceId"]
    assert first != second
