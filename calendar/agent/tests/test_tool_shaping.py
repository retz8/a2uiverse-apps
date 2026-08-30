"""Tool-shaping: notification suppression, projection notes, and corpus capture.

Suppression is the load-bearing one, and it is asserted the way a safety layer should be:
it applies in every mode, it overrides whatever the model asked for, and it covers both
spellings the Calendar API has used. There is no pseudonymizer here to test — the demo
calendar has nothing to pseudonymize (task-2.7 decision 4) — so what replaces those
assertions is the guarantee that this layer no longer rewrites payloads at all.
"""

from __future__ import annotations

import json

from llm_agent.tool_shaping import (
    EVENT_COUNT_NOTE,
    PROJECTION_NOTE,
    annotate,
    capture_tool_result,
    recording,
    shape_tool_response,
    suppress_notifications,
)


def _mcp(payload: dict) -> dict:
    return {"content": [{"type": "text", "text": json.dumps(payload)}]}


def _decoded(response: dict) -> dict:
    return json.loads(response["content"][0]["text"])


PAYLOAD = {
    "events": [
        {
            "id": "ev-1",
            "summary": "Design review",
            "start": {"dateTime": "2026-08-30T11:00:00+09:00"},
            "end": {"dateTime": "2026-08-30T12:00:00+09:00"},
            "attendees": [{"email": "alex.bergman@example.com", "responseStatus": "accepted"}],
        }
    ]
}


class TestNotificationSuppression:
    def test_forces_the_modern_parameter_to_none(self):
        assert suppress_notifications({"sendUpdates": "all"})["sendUpdates"] == "none"

    def test_forces_the_legacy_parameter_to_false(self):
        assert suppress_notifications({"sendNotifications": True})["sendNotifications"] is False

    def test_pins_both_even_when_the_caller_passed_neither(self):
        # The guard does not depend on the model having mentioned notifications. A tool whose
        # server-side default is "notify" would otherwise mail people on an argument nobody
        # wrote.
        guarded = suppress_notifications({"summary": "Design team sync"})
        assert guarded["sendUpdates"] == "none"
        assert guarded["sendNotifications"] is False

    def test_leaves_every_other_argument_alone(self):
        args = {"summary": "Design team sync", "start": "2026-09-03T14:00:00+09:00"}
        guarded = suppress_notifications(args)
        assert guarded["summary"] == args["summary"]
        assert guarded["start"] == args["start"]

    def test_does_not_mutate_the_caller_s_dict(self):
        args = {"sendUpdates": "all"}
        suppress_notifications(args)
        assert args["sendUpdates"] == "all"

    def test_applies_with_the_recorder_off(self, monkeypatch):
        # Suppression is a live-mode concern, not a record-mode one. Gmail's substitution was
        # gated on recording; this must not be, or the only runs that reach real people are
        # exactly the unguarded ones.
        monkeypatch.delenv("A2UI_RECORD_DIR", raising=False)
        assert recording() is None
        assert suppress_notifications({"sendUpdates": "all"})["sendUpdates"] == "none"

    def test_a_non_dict_is_passed_through(self):
        assert suppress_notifications(None) is None


class TestProjectionNote:
    def test_states_that_an_absent_field_was_not_fetched(self):
        assert "was NOT fetched" in PROJECTION_NOTE

    def test_counts_events_rather_than_leaving_it_to_be_inferred(self):
        annotated = annotate(PAYLOAD)
        assert annotated["event_count"] == 1
        assert EVENT_COUNT_NOTE in annotated["_payload_notes"]

    def test_says_the_count_covers_the_query_not_the_calendar(self):
        # The failure this prevents: reporting a quiet afternoon because the range asked
        # about a morning.
        assert "not of everything on the calendar" in EVENT_COUNT_NOTE

    def test_a_payload_without_events_still_gets_the_projection_note(self):
        annotated = annotate({"busy": []})
        assert annotated["_payload_notes"] == [PROJECTION_NOTE]


class TestPassThrough:
    def test_a_non_dict_response_is_passed_through(self):
        assert shape_tool_response("nope") is None

    def test_a_response_without_content_is_passed_through(self):
        assert shape_tool_response({"structuredContent": {}}) is None

    def test_unparseable_text_is_left_alone(self):
        assert shape_tool_response({"content": [{"type": "text", "text": "not json"}]}) is None

    def test_shaping_adds_notes_without_touching_the_data(self):
        shaped = shape_tool_response(_mcp(PAYLOAD))
        decoded = _decoded(shaped)
        assert decoded["events"] == PAYLOAD["events"]
        assert PROJECTION_NOTE in decoded["_payload_notes"]


class TestCaptureDoesNotRewrite:
    """The half of Gmail's boundary that Calendar deliberately does not have.

    Gmail had to walk every branch of a CallToolResult because it was substituting, and a
    branch it missed was a leak. Nothing is substituted here, so the assertion inverts: the
    result must come back byte-for-byte, both branches included, and only a copy is recorded.
    """

    def _result(self) -> dict:
        return {
            "content": [{"type": "text", "text": json.dumps(PAYLOAD)}],
            "structuredContent": json.loads(json.dumps(PAYLOAD)),
        }

    def test_the_result_is_returned_unchanged(self, monkeypatch, tmp_path):
        monkeypatch.setenv("A2UI_RECORD_DIR", str(tmp_path))
        result = self._result()
        assert capture_tool_result(result, "list_events") == self._result()

    def test_both_branches_still_agree_afterwards(self, monkeypatch, tmp_path):
        monkeypatch.setenv("A2UI_RECORD_DIR", str(tmp_path))
        returned = capture_tool_result(self._result(), "list_events")
        assert json.loads(returned["content"][0]["text"]) == returned["structuredContent"]

    def test_the_corpus_is_captured_from_the_structured_branch(self, monkeypatch, tmp_path):
        monkeypatch.setenv("A2UI_RECORD_DIR", str(tmp_path))
        capture_tool_result(self._result(), "list_events")
        written = (tmp_path / "payloads" / "list_events.jsonl").read_text(encoding="utf-8")
        assert json.loads(written.strip()) == PAYLOAD

    def test_nothing_is_captured_off_record(self, monkeypatch, tmp_path):
        monkeypatch.delenv("A2UI_RECORD_DIR", raising=False)
        capture_tool_result(self._result(), "list_events")
        assert not (tmp_path / "payloads").exists()

    def test_a_non_dict_result_is_passed_through(self, monkeypatch, tmp_path):
        monkeypatch.setenv("A2UI_RECORD_DIR", str(tmp_path))
        assert capture_tool_result("raw", "list_events") == "raw"
