"""Record-mode corpus capture: gating, the jsonl append, and the decode preference."""

from __future__ import annotations

import json

from a2ui_agent_kit.corpus import capture_payload, corpus_payload, recording
from a2ui_agent_kit.recorder import RECORD_DIR_ENV


class TestRecordingGate:
    def test_armed_by_the_recorder_env(self, monkeypatch, tmp_path):
        monkeypatch.setenv(RECORD_DIR_ENV, str(tmp_path))
        assert recording() == str(tmp_path)

    def test_off_otherwise(self, monkeypatch):
        monkeypatch.delenv(RECORD_DIR_ENV, raising=False)
        assert recording() is None


class TestCapturePayload:
    def test_appends_one_jsonl_line_per_call(self, monkeypatch, tmp_path):
        monkeypatch.setenv(RECORD_DIR_ENV, str(tmp_path))
        capture_payload("list_events", {"events": [1]})
        capture_payload("list_events", {"events": [1, 2]})
        lines = (tmp_path / "payloads" / "list_events.jsonl").read_text().splitlines()
        assert [json.loads(line) for line in lines] == [
            {"events": [1]},
            {"events": [1, 2]},
        ]

    def test_captures_nothing_off_record(self, monkeypatch, tmp_path):
        monkeypatch.delenv(RECORD_DIR_ENV, raising=False)
        capture_payload("t", {"a": 1})
        assert not (tmp_path / "payloads").exists()

    def test_an_unserializable_payload_never_raises(self, monkeypatch, tmp_path):
        monkeypatch.setenv(RECORD_DIR_ENV, str(tmp_path))
        capture_payload("t", object())


class TestCorpusPayload:
    def test_prefers_the_structured_field(self):
        result = {
            "structuredContent": {"a": 1},
            "content": [{"type": "text", "text": json.dumps({"b": 2})}],
        }
        assert corpus_payload(result) == {"a": 1}

    def test_falls_back_to_the_first_json_text_part(self):
        result = {
            "structuredContent": {},
            "content": [
                {"type": "text", "text": "not json"},
                {"type": "text", "text": json.dumps({"b": 2})},
            ],
        }
        assert corpus_payload(result) == {"b": 2}

    def test_an_empty_result_decodes_to_an_empty_object(self):
        assert corpus_payload({}) == {}
        assert corpus_payload({"content": None}) == {}
