"""The shaping walker's mechanics, with a fake annotate hook.

What the notes SAY is vendor policy and is tested in each vendor's suite; here the
subject is the walker itself — where it applies the hook, what it copies, and that
it can never cost a live turn.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

from a2ui_agent_kit.tool_shaping import (
    SHAPE_DUMP_ENV,
    describe,
    record_shape,
    shape_tool_response,
)


def _tag(payload):
    if not isinstance(payload, dict):
        return None
    return {**payload, "_tagged": True}


def _mcp(payload) -> dict:
    return {"content": [{"type": "text", "text": json.dumps(payload)}], "isError": False}


class TestWalker:
    def test_applies_the_hook_inside_the_encoded_text_part(self):
        shaped = shape_tool_response(_mcp({"a": 1}), "t", annotate=_tag)
        assert json.loads(shaped["content"][0]["text"]) == {"a": 1, "_tagged": True}

    def test_builds_a_new_response_rather_than_mutating(self):
        response = _mcp({"a": 1})
        original = json.loads(json.dumps(response))
        shaped = shape_tool_response(response, "t", annotate=_tag)
        assert shaped is not response
        assert response == original

    def test_returns_none_when_the_hook_declined_everything(self):
        assert shape_tool_response(_mcp([1, 2, 3]), "t", annotate=_tag) is None

    def test_preserves_parts_the_hook_did_not_touch(self):
        response = {
            "content": [
                {"type": "image", "data": "…"},
                {"type": "text", "text": "not json"},
                {"type": "text", "text": json.dumps({"a": 1})},
            ]
        }
        shaped = shape_tool_response(response, "t", annotate=_tag)
        assert shaped["content"][0] == {"type": "image", "data": "…"}
        assert shaped["content"][1] == {"type": "text", "text": "not json"}
        assert json.loads(shaped["content"][2]["text"])["_tagged"] is True

    def test_a_non_dict_response_is_passed_through(self):
        assert shape_tool_response("nope", "t", annotate=_tag) is None

    def test_a_response_without_content_is_passed_through(self):
        assert shape_tool_response({"isError": True}, "t", annotate=_tag) is None

    def test_unparseable_text_alone_changes_nothing(self):
        response = {"content": [{"type": "text", "text": "not json"}]}
        assert shape_tool_response(response, "t", annotate=_tag) is None

    def test_never_raises(self):
        class Exploding(dict):
            def get(self, *_args, **_kwargs):
                raise RuntimeError("boom")

        assert shape_tool_response(Exploding(), "t", annotate=_tag) is None

        def exploding_annotate(_payload):
            raise RuntimeError("boom")

        assert shape_tool_response(_mcp({"a": 1}), "t", annotate=exploding_annotate) is None


class TestDescribe:
    def test_sketches_types_not_content(self):
        sketch = describe({"a": "secret", "b": [1], "c": {"d": {"e": 1}}})
        assert sketch == {"a": "str", "b": ["int"], "c": {"d": ["e"]}}

    def test_an_empty_list_stays_empty(self):
        assert describe({"a": []}) == {"a": []}


class TestRecordShape:
    def test_off_unless_the_env_asks(self, monkeypatch, tmp_path):
        monkeypatch.delenv(SHAPE_DUMP_ENV, raising=False)
        record_shape("t", {"a": 1}, {"x": 1}, app_dir=tmp_path)
        assert not (tmp_path / "tool_shapes.dump.jsonl").exists()

    def test_dumps_the_shape_never_the_content(self, monkeypatch, tmp_path):
        monkeypatch.setenv(SHAPE_DUMP_ENV, "1")
        record_shape("t", {"a": 1}, {"x": "private value"}, app_dir=tmp_path)
        line = json.loads((tmp_path / "tool_shapes.dump.jsonl").read_text())
        assert line == {"tool": "t", "args": ["a"], "shape": {"x": "str"}}
        assert "private value" not in json.dumps(line)

    def test_a_dump_failure_never_raises(self, monkeypatch, tmp_path):
        monkeypatch.setenv(SHAPE_DUMP_ENV, "1")
        record_shape("t", {}, {"x": object()}, app_dir=tmp_path)  # unserializable

    def test_anchors_the_dump_to_the_app_dir(self, monkeypatch, tmp_path):
        monkeypatch.setenv(SHAPE_DUMP_ENV, "1")
        app_dir = Path(tmp_path) / "agent"
        os.makedirs(app_dir)
        record_shape("t", {}, {}, app_dir=app_dir)
        assert (app_dir / "tool_shapes.dump.jsonl").is_file()
