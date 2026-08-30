"""Tool-response shaping: pseudonymization in record mode, and projection notes.

The pseudonymizer is the only thing standing between a real mailbox and a public repo, so
its guarantees are asserted directly: it is off unless recording, it is deterministic, it
preserves length, and it leaves no original substring behind.
"""

from __future__ import annotations

import json

from llm_agent.tool_shaping import (
    PROJECTION_NOTE,
    THREAD_COUNT_NOTE,
    annotate,
    pseudonymize,
    recording,
    shape_tool_response,
)


def _mcp(payload: dict) -> dict:
    return {"content": [{"type": "text", "text": json.dumps(payload)}]}


def _decoded(response: dict) -> dict:
    return json.loads(response["content"][0]["text"])


PAYLOAD = {
    "threads": [
        {
            "id": "th-1",
            "messages": [
                {
                    "sender": "Real Person <real.person@corp.invalid>",
                    "subject": "An actual subject line from a real mailbox",
                    "snippet": "Genuinely private content that must never reach a fixture.",
                    "labelIds": ["INBOX", "UNREAD"],
                }
            ],
        }
    ]
}


class TestPseudonymizationIsGated:
    def test_off_when_not_recording(self, monkeypatch):
        monkeypatch.delenv("A2UI_RECORD_DIR", raising=False)
        assert recording() is None
        shaped = shape_tool_response(_mcp(PAYLOAD), "search_threads")
        message = _decoded(shaped)["threads"][0]["messages"][0]
        # The live path is untouched and fully real — annotation only.
        assert message["sender"] == "Real Person <real.person@corp.invalid>"

    def test_on_when_recording(self, monkeypatch, tmp_path):
        monkeypatch.setenv("A2UI_RECORD_DIR", str(tmp_path))
        shaped = shape_tool_response(_mcp(PAYLOAD), "search_threads")
        assert "real.person@corp.invalid" not in json.dumps(shaped)

    def test_recording_captures_the_payload_for_the_stub_corpus(self, monkeypatch, tmp_path):
        monkeypatch.setenv("A2UI_RECORD_DIR", str(tmp_path))
        shape_tool_response(_mcp(PAYLOAD), "search_threads")
        captured = (tmp_path / "payloads" / "search_threads.jsonl").read_text()
        assert "corp.invalid" not in captured  # captured AFTER substitution, never before
        assert "example.com" in captured


class TestPseudonymization:
    def test_no_original_substring_survives(self):
        out = json.dumps(pseudonymize(PAYLOAD))
        for secret in ("real.person", "corp.invalid", "Real Person", "Genuinely private"):
            assert secret not in out

    def test_is_deterministic(self):
        # A re-recorded beat must reproduce the same stand-ins, or its committed screenshot
        # baseline stops matching for a reason unrelated to the change under test.
        assert pseudonymize(PAYLOAD) == pseudonymize(PAYLOAD)

    def test_preserves_prose_length(self):
        # The recorded stream drives pixel baselines: a replacement of a different length
        # reflows the layout into a different picture.
        original = PAYLOAD["threads"][0]["messages"][0]["subject"]
        out = pseudonymize(PAYLOAD)["threads"][0]["messages"][0]["subject"]
        assert len(out) == len(original)

    def test_keeps_an_address_shaped_value_address_shaped(self):
        out = pseudonymize({"sender": "Someone Real <someone@example.org>"})["sender"]
        assert "<" in out and out.endswith(">") and "@" in out

    def test_leaves_opaque_handles_alone(self):
        # Ids and label ids are handles, not content; rewriting them would break the very
        # round-trips the fixtures exist to replay.
        out = pseudonymize(PAYLOAD)
        assert out["threads"][0]["id"] == "th-1"
        assert out["threads"][0]["messages"][0]["labelIds"] == ["INBOX", "UNREAD"]

    def test_same_address_maps_to_the_same_stand_in(self):
        assert (
            pseudonymize({"sender": "x@example.org"})["sender"]
            == pseudonymize({"from": "x@example.org"})["from"]
        )

    def test_system_label_names_survive(self):
        # The agent's logic and the domain doc both key on these, and they say nothing
        # about the person.
        labels = {"labels": [{"id": "INBOX", "name": "INBOX"}, {"id": "C", "name": "CATEGORY_SOCIAL"}]}
        out = pseudonymize(labels)["labels"]
        assert out[0]["name"] == "INBOX"
        assert out[1]["name"] == "CATEGORY_SOCIAL"

    def test_user_label_names_are_substituted(self):
        # Someone wrote these by hand; "Medical" is as private as a subject line.
        out = pseudonymize({"labels": [{"id": "L_1", "name": "Medical"}]})["labels"][0]
        assert out["name"] != "Medical"
        assert out["id"] == "L_1"


class TestProjectionNote:
    def test_states_that_an_absent_field_was_not_fetched(self):
        assert "was NOT fetched" in PROJECTION_NOTE
        assert PROJECTION_NOTE in annotate({"threads": []})["_payload_notes"]

    def test_counts_a_thread_rather_than_leaving_it_to_be_inferred(self):
        out = annotate({"messages": [{}, {}, {}]})
        assert out["message_count"] == 3
        assert THREAD_COUNT_NOTE in out["_payload_notes"]

    def test_counts_threads_in_a_search_result(self):
        assert annotate({"threads": [{}, {}]})["thread_count"] == 2


class TestPassThrough:
    def test_a_non_dict_response_is_passed_through(self):
        assert shape_tool_response("not a dict") is None

    def test_a_response_without_content_is_passed_through(self):
        assert shape_tool_response({"other": 1}) is None

    def test_unparseable_text_is_left_alone(self):
        assert shape_tool_response({"content": [{"type": "text", "text": "not json"}]}) is None

    def test_shaping_never_raises(self, monkeypatch, tmp_path):
        monkeypatch.setenv("A2UI_RECORD_DIR", str(tmp_path))
        for candidate in (None, 1, [], {}, {"content": None}, {"content": [1, 2]}):
            shape_tool_response(candidate, "t")
