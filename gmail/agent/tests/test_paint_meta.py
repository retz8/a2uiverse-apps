"""Unit tests for the paint-meta shell layer (task 8.5): tag filter + marker rules."""

import pytest

from llm_agent.paint_meta import (
    PAINT_META_MIME,
    PaintTitleTagFilter,
    create_paint_meta_part,
    validate_question_markers,
)


def test_complete_tag_in_one_chunk():
    f = PaintTitleTagFilter()
    text, metas = f.feed(
        'Here you go. <paint-title surface="pr-list">Open PRs — a2ui</paint-title> done.'
    )
    assert text == "Here you go.  done."
    assert metas == [{"surfaceId": "pr-list", "title": "Open PRs — a2ui"}]


def test_tag_split_across_many_chunks():
    f = PaintTitleTagFilter()
    chunks = ["intro <pai", 'nt-title surface="s', '1">Reviewing ', "PR #48</paint-", "title> outro"]
    out, metas = "", []
    for chunk in chunks:
        text, found = f.feed(chunk)
        out += text
        metas += found
    out += f.flush()
    assert out == "intro  outro"
    assert metas == [{"surfaceId": "s1", "title": "Reviewing PR #48"}]


def test_title_text_never_reaches_prose():
    f = PaintTitleTagFilter()
    text, _ = f.feed('<paint-title surface="s1">Secret title')
    assert text == ""  # open tag held whole, inner text included
    text, metas = f.feed("</paint-title>")
    assert text == ""
    assert metas[0]["title"] == "Secret title"


def test_kind_attribute_carried():
    f = PaintTitleTagFilter()
    _, metas = f.feed('<paint-title surface="q1" kind="question">Confirm repo</paint-title>')
    assert metas == [{"surfaceId": "q1", "title": "Confirm repo", "kind": "question"}]


def test_tag_without_surface_attribute_is_dropped():
    f = PaintTitleTagFilter()
    text, metas = f.feed("a <paint-title>No surface</paint-title> b")
    assert metas == []
    assert text == "a  b"


def test_lone_angle_bracket_releases_when_ruled_out():
    f = PaintTitleTagFilter()
    text, _ = f.feed("a < b")
    # "< b" cannot be a tag prefix ("<" followed by " ") — nothing held.
    assert text == "a < b"
    assert f.flush() == ""


def test_possible_prefix_held_then_released():
    f = PaintTitleTagFilter()
    text, _ = f.feed("count: 1 <pa")
    assert text == "count: 1 "
    text, _ = f.feed("rt of the plan")
    assert text == "<part of the plan"


def test_flush_releases_unclosed_tag():
    f = PaintTitleTagFilter()
    text, _ = f.feed('tail <paint-title surface="s1">never closed')
    assert text == "tail "
    assert f.flush() == '<paint-title surface="s1">never closed'


def test_multiple_tags_in_one_stream():
    f = PaintTitleTagFilter()
    _, metas = f.feed(
        '<paint-title surface="a">A</paint-title><paint-title surface="b">B</paint-title>'
    )
    assert [m["surfaceId"] for m in metas] == ["a", "b"]


def test_no_surface_tag_is_stripped_and_raises_the_flag():
    f = PaintTitleTagFilter()
    text, metas = f.feed("Cannot post — read-only access.\n<no-surface/>\n")
    assert text == "Cannot post — read-only access.\n\n"
    assert metas == []
    assert f.no_surface is True


def test_no_surface_tag_split_across_chunks():
    f = PaintTitleTagFilter()
    out = ""
    for chunk in ("draft kept. <no-su", "rface/", "> done"):
        text, _ = f.feed(chunk)
        out += text
    out += f.flush()
    assert out == "draft kept.  done"
    assert f.no_surface is True


def test_no_surface_flag_defaults_false():
    f = PaintTitleTagFilter()
    text, _ = f.feed('prose <paint-title surface="s1">T</paint-title>')
    assert f.no_surface is False
    assert text == "prose "


def test_create_paint_meta_part_shape():
    part = create_paint_meta_part({"surfaceId": "s1", "title": "T"})
    assert part.root.data == {"paintMeta": {"surfaceId": "s1", "title": "T"}}
    assert part.root.metadata == {"mimeType": PAINT_META_MIME}
    # No inline `version` field: the client's A2UI extractor must never take this
    # for a protocol message.
    assert "version" not in part.root.data


def _payload(surface_id: str, *, answerable: bool) -> list[dict]:
    """A surface that either carries an action the user can answer with, or does not."""
    components: list[dict] = [{"id": "root", "component": "Card", "child": "body"}]
    if answerable:
        components.append(
            {
                "id": "body",
                "component": "Button",
                "child": "label",
                "action": {"event": {"name": "confirm-draft", "context": {}}},
            }
        )
    else:
        components.append({"id": "body", "component": "Text", "text": "Save this reply?"})
    return [
        {"version": "v0.9", "createSurface": {"surfaceId": surface_id, "catalogId": "c"}},
        {
            "version": "v0.9",
            "updateComponents": {"surfaceId": surface_id, "components": components},
        },
    ]


# Decision 15: the structural half of the GitHub agent's check has no anchor in the basic
# catalog — there is no rare, purpose-built dialog component, and Card roots most surfaces.
# What stays checkable is that a declared question can actually be answered.


def test_a_declared_question_carrying_an_action_passes():
    metas = {"q1": {"surfaceId": "q1", "kind": "question"}}
    validate_question_markers(_payload("q1", answerable=True), metas)


def test_a_declared_question_with_no_action_is_rejected():
    # Asking something the user has no way to answer is a dead end, not a question.
    metas = {"q1": {"surfaceId": "q1", "kind": "question"}}
    with pytest.raises(ValueError, match="carries no action"):
        validate_question_markers(_payload("q1", answerable=False), metas)


def test_an_ordinary_surface_needs_no_action():
    metas = {"s1": {"surfaceId": "s1", "title": "Waiting on you"}}
    validate_question_markers(_payload("s1", answerable=False), metas)


def test_an_undeclared_surface_is_never_forced_to_be_a_question():
    # A Card root says nothing about intent here, so nothing is inferred from shape.
    validate_question_markers(_payload("s1", answerable=True), {})
