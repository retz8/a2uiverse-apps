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
    pin_calendar,
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
    """The parameter name and value come from the server's own tool schema, not from us.

    The first draft of this guard pinned `sendUpdates`/`sendNotifications` — the REST API v3
    spelling — which this MCP server does not take. It set two arguments nothing reads and
    suppressed nothing. The live schema says `notificationLevel`, enum
    NOTIFICATION_LEVEL_UNSPECIFIED | NONE | EXTERNAL_ONLY | ALL, with unspecified documented
    as "Treated as ALL". So these assert the exact vocabulary; a rename upstream must fail
    here rather than degrade quietly to a guard that mails everyone.
    """

    def test_forces_the_notification_level_to_none(self):
        assert suppress_notifications({"notificationLevel": "ALL"})["notificationLevel"] == "NONE"

    def test_overrides_external_only_too(self):
        # EXTERNAL_ONLY still mails people; it is not a partial win.
        assert (
            suppress_notifications({"notificationLevel": "EXTERNAL_ONLY"})["notificationLevel"]
            == "NONE"
        )

    def test_pins_it_even_when_the_caller_passed_nothing(self):
        # The load-bearing case. Absent is documented as "Treated as ALL", so omitting the
        # argument is the LOUD choice — the guard must add it, not merely correct it.
        assert suppress_notifications({"summary": "Design team sync"})["notificationLevel"] == "NONE"

    def test_the_silent_value_is_one_the_server_accepts(self):
        # A value outside the enum would be rejected at call time, turning a safety guard
        # into an outage — and tempting whoever debugs it to remove the guard.
        assert "NONE" in {"NOTIFICATION_LEVEL_UNSPECIFIED", "NONE", "EXTERNAL_ONLY", "ALL"}

    def test_leaves_every_other_argument_alone(self):
        args = {"summary": "Design team sync", "startTime": "2026-09-03T14:00:00-04:00"}
        guarded = suppress_notifications(args)
        assert guarded["summary"] == args["summary"]
        assert guarded["startTime"] == args["startTime"]

    def test_does_not_mutate_the_caller_s_dict(self):
        args = {"notificationLevel": "ALL"}
        suppress_notifications(args)
        assert args["notificationLevel"] == "ALL"

    def test_applies_with_the_recorder_off(self, monkeypatch):
        # Suppression is a live-mode concern, not a record-mode one. Gmail's substitution was
        # gated on recording; this must not be, or the only runs that reach real people are
        # exactly the unguarded ones.
        monkeypatch.delenv("A2UI_RECORD_DIR", raising=False)
        assert recording() is None
        assert suppress_notifications({"notificationLevel": "ALL"})["notificationLevel"] == "NONE"

    def test_a_non_dict_is_passed_through(self):
        assert suppress_notifications(None) is None


class TestPinsRespectTheToolSchema:
    """A pin applied to a tool that does not declare the parameter is a hard failure.

    The server answers an undeclared argument with 400 "Unknown name ... Cannot find field",
    verified live: `list_events` with a `notificationLevel` is a 400, without it a 200. An
    earlier draft applied suppression unconditionally "to reads as well as writes" on the
    theory that it was the defensive choice. It would have broken every read the agent makes.
    """

    WRITE_ARGS = {"summary", "startTime", "endTime", "calendarId", "notificationLevel"}
    READ_ARGS = {"calendarId", "startTime", "endTime", "pageSize"}

    def test_notification_pin_is_skipped_on_a_tool_without_the_parameter(self):
        out = suppress_notifications({"calendarId": "x", "pageSize": 3}, self.READ_ARGS)
        assert "notificationLevel" not in out

    def test_notification_pin_is_applied_on_a_tool_with_it(self):
        out = suppress_notifications({"summary": "s"}, self.WRITE_ARGS)
        assert out["notificationLevel"] == "NONE"

    def test_calendar_pin_is_skipped_on_a_tool_without_the_parameter(self, monkeypatch):
        monkeypatch.setenv("CALENDAR_ID", "demo@group.calendar.google.com")
        assert "calendarId" not in pin_calendar({"query": "review"}, {"query", "pageSize"})

    def test_calendar_pin_is_applied_on_a_tool_with_it(self, monkeypatch):
        monkeypatch.setenv("CALENDAR_ID", "demo@group.calendar.google.com")
        out = pin_calendar({"calendarId": "primary"}, self.READ_ARGS)
        assert out["calendarId"] == "demo@group.calendar.google.com"

    def test_an_empty_schema_pins_nothing(self):
        # A tool whose schema could not be read must not have arguments invented for it.
        assert suppress_notifications({"a": 1}, set()) == {"a": 1}
        assert pin_calendar({"a": 1}, set()) == {"a": 1}


class TestCalendarPinning:
    """The agent must not be able to read `primary`, whatever the model asks for.

    `calendarId` is a per-call argument and the API's default is the user's own calendar.
    Decision 4's whole guarantee — that a recording bound for a public repo contains only
    authored events — rests on this, so it is overwritten rather than defaulted.
    """

    def test_overwrites_primary(self, monkeypatch):
        monkeypatch.setenv("CALENDAR_ID", "demo@group.calendar.google.com")
        assert pin_calendar({"calendarId": "primary"})["calendarId"] == (
            "demo@group.calendar.google.com"
        )

    def test_adds_the_argument_when_the_caller_omitted_it(self, monkeypatch):
        monkeypatch.setenv("CALENDAR_ID", "demo@group.calendar.google.com")
        assert pin_calendar({"eventId": "ev-1"})["calendarId"] == "demo@group.calendar.google.com"

    def test_overwrites_any_other_calendar(self, monkeypatch):
        monkeypatch.setenv("CALENDAR_ID", "demo@group.calendar.google.com")
        pinned = pin_calendar({"calendarId": "someone.else@example.com"})
        assert pinned["calendarId"] == "demo@group.calendar.google.com"

    def test_does_not_mutate_the_caller_s_dict(self, monkeypatch):
        monkeypatch.setenv("CALENDAR_ID", "demo@group.calendar.google.com")
        args = {"calendarId": "primary"}
        pin_calendar(args)
        assert args["calendarId"] == "primary"

    def test_never_invents_primary_when_the_id_is_unset(self, monkeypatch):
        # Startup already refuses without an id; this must not paper over that by filling in
        # a default, which would be the exact failure the guard exists to prevent.
        monkeypatch.delenv("CALENDAR_ID", raising=False)
        assert "calendarId" not in pin_calendar({"eventId": "ev-1"})


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
