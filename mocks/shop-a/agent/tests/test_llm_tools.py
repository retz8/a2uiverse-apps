"""The two LLM modes' tools: the same four, over the same dataset, one of them frozen.

Stub has no vendor to stub out, so its job is instead to be the mode where the
instruments are inert (task-4.6 decision 13): writes are acknowledged and change
nothing. Live keeps what it changes.
"""

from __future__ import annotations

import pytest

from app import dataset
from app.store import Listing
from app.tools import LIVE_TOOLS, STUB_TOOLS

TOOL_NAMES = ["list_cameras", "open_camera", "sort_cameras", "store_policy"]


def _tool(tools, name):
    return next(t for t in tools if t.__name__ == name)


@pytest.fixture(autouse=True)
def _reset():
    _tool(LIVE_TOOLS, "list_cameras").__globals__  # noqa: B018 - documents the closure
    yield
    from app.store import LIVE_LISTING

    LIVE_LISTING.reset()


@pytest.mark.parametrize("tools", [STUB_TOOLS, LIVE_TOOLS])
def test_both_modes_hold_the_same_four_tools(tools):
    assert [t.__name__ for t in tools] == TOOL_NAMES


@pytest.mark.parametrize("tools", [STUB_TOOLS, LIVE_TOOLS])
def test_every_tool_documents_itself_for_the_model(tools):
    # The kit derives each tool's schema from its docstring.
    for tool in tools:
        assert tool.__doc__ and "Returns:" in tool.__doc__


@pytest.mark.parametrize("tools", [STUB_TOOLS, LIVE_TOOLS])
def test_listing_returns_bindable_rows(tools):
    items = _tool(tools, "list_cameras")()["items"]
    assert items == dataset.catalogue()


@pytest.mark.parametrize("tools", [STUB_TOOLS, LIVE_TOOLS])
def test_opening_a_camera_carries_the_blurb_and_reports_a_miss(tools):
    open_camera = _tool(tools, "open_camera")
    assert open_camera(dataset.catalogue()[0]["id"])["detail"]["blurb"]
    assert "error" in open_camera("no-such-camera")


@pytest.mark.parametrize("tools", [STUB_TOOLS, LIVE_TOOLS])
def test_the_policy_is_returned_as_text(tools):
    assert _tool(tools, "store_policy")()["policy"] == dataset.policy()


def test_a_live_sort_is_kept_and_a_later_listing_reflects_it():
    result = _tool(LIVE_TOOLS, "sort_cameras")("price")
    assert result["applied"] is True
    assert result["items"] == dataset.sorted_catalogue("price")
    assert _tool(LIVE_TOOLS, "list_cameras")()["items"] == dataset.sorted_catalogue("price")


def test_a_stub_sort_is_acknowledged_and_changes_nothing():
    result = _tool(STUB_TOOLS, "sort_cameras")("price")
    assert result["applied"] is False
    assert result["items"] == dataset.catalogue()
    assert _tool(STUB_TOOLS, "list_cameras")()["items"] == dataset.catalogue()


@pytest.mark.parametrize("tools", [STUB_TOOLS, LIVE_TOOLS])
def test_an_unknown_sort_key_reports_rather_than_raising(tools):
    result = _tool(tools, "sort_cameras")("colour")
    assert "error" in result and result["items"] == dataset.catalogue()


def test_a_frozen_listing_never_mutates_even_across_sorts():
    frozen = Listing(mutable=False)
    frozen.sort("price")
    assert frozen.items == dataset.catalogue()
