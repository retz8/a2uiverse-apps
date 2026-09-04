"""The beat driver's usability gate.

A recording is usable when every turn completed and delivered A2UI, and the group as a
whole painted a surface. The `createSurface` requirement sits on the group rather than
on each turn (task-4.6 decision 15): a turn that only updates an existing surface is an
ordinary paint the protocol allows and the prompt prose invites, and it is the shape an
in-fragment instrument takes.
"""

from __future__ import annotations

from a2ui_agent_kit.beats import group_is_good, turn_is_good


def turn(outcome: str = "completed", *, messages: list[dict] | None = None) -> dict:
    return {"outcome": outcome, "batches": [{"messages": messages or []}]}


CREATE = {"createSurface": {"surfaceId": "list"}}
UPDATE = {"updateDataModel": {"surfaceId": "list", "path": "/items", "value": []}}


def test_a_turn_is_good_when_it_completed_and_delivered_a2ui():
    assert turn_is_good(turn(messages=[CREATE])) == (True, "ok")
    assert turn_is_good(turn(messages=[UPDATE])) == (True, "ok")


def test_a_turn_that_did_not_complete_or_delivered_nothing_is_not_good():
    ok, why = turn_is_good(turn("apology", messages=[CREATE]))
    assert not ok and "apology" in why
    ok, why = turn_is_good(turn(messages=[]))
    assert not ok and "no A2UI" in why


def test_an_update_only_turn_is_recordable_when_its_group_painted():
    """The instruments' shape: a list paint, then turns that only mutate it."""
    ok, _ = group_is_good([turn(messages=[CREATE]), turn(messages=[UPDATE])])
    assert ok


def test_a_group_that_never_painted_is_not_recordable():
    ok, why = group_is_good([turn(messages=[UPDATE])])
    assert not ok and "createSurface" in why


def test_a_group_names_the_turn_that_failed():
    ok, why = group_is_good([turn(messages=[CREATE]), turn("apology", messages=[UPDATE])])
    assert not ok and "turn 2" in why
