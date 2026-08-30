"""L0 recorder tests: the wire recorder is off by default and lossless when armed."""

import json

import pytest
from a2a.types import Part, TextPart
from a2ui.a2a.parts import create_a2ui_part

from llm_agent.recorder import NullRecorder, SessionRecorder, create_recorder


def _a2ui_part(surface_id: str) -> Part:
    return create_a2ui_part(
        {"version": "v0.9", "createSurface": {"surfaceId": surface_id, "catalogId": "c"}},
        version="v0.9",
    )


def _text_part(text: str) -> Part:
    return Part(root=TextPart(text=text))


def test_create_recorder_without_a_dir_is_a_null_recorder():
    assert isinstance(create_recorder(None), NullRecorder)
    assert isinstance(create_recorder(""), NullRecorder)


def test_null_recorder_accepts_every_call_and_writes_nothing(tmp_path):
    rec = create_recorder(None)
    rec.start_turn(context_id="ctx", task_id="t", kind="utterance", prompt="hi")
    rec.record_batch([_a2ui_part("s1")])
    rec.end_turn("completed")
    assert list(tmp_path.iterdir()) == []


def test_create_recorder_with_a_dir_is_a_session_recorder(tmp_path):
    assert isinstance(create_recorder(str(tmp_path)), SessionRecorder)


def test_a_recorded_turn_lands_as_a_session_file(tmp_path):
    rec = create_recorder(str(tmp_path))
    rec.start_turn(context_id="ctx-1", task_id="task-1", kind="utterance", prompt="show me")
    rec.record_batch([_a2ui_part("s1")])
    rec.end_turn("completed")

    written = list(tmp_path.glob("*.json"))
    assert len(written) == 1
    session = json.loads(written[0].read_text(encoding="utf-8"))
    assert session["contextId"] == "ctx-1"
    assert len(session["turns"]) == 1
    turn = session["turns"][0]
    assert turn["kind"] == "utterance"
    assert turn["prompt"] == "show me"
    assert turn["outcome"] == "completed"


def test_a_batch_splits_a2ui_messages_from_agent_text_the_way_the_client_does(tmp_path):
    """The client pulls messages and text out of one event separately; a batch mirrors that."""
    rec = create_recorder(str(tmp_path))
    rec.start_turn(context_id="ctx", task_id="t", kind="utterance", prompt="p")
    rec.record_batch([_text_part("thinking..."), _a2ui_part("s1")])
    rec.end_turn("completed")

    session = json.loads(next(tmp_path.glob("*.json")).read_text(encoding="utf-8"))
    (batch,) = session["turns"][0]["batches"]
    assert batch["texts"] == ["thinking..."]
    assert batch["messages"] == [
        {"version": "v0.9", "createSurface": {"surfaceId": "s1", "catalogId": "c"}}
    ]
    assert isinstance(batch["offsetMs"], int)


def test_batch_order_is_preserved_because_replay_is_a_stream_not_a_snapshot(tmp_path):
    rec = create_recorder(str(tmp_path))
    rec.start_turn(context_id="ctx", task_id="t", kind="utterance", prompt="p")
    for sid in ("s1", "s2", "s3"):
        rec.record_batch([_a2ui_part(sid)])
    rec.end_turn("completed")

    session = json.loads(next(tmp_path.glob("*.json")).read_text(encoding="utf-8"))
    batches = session["turns"][0]["batches"]
    assert [b["messages"][0]["createSurface"]["surfaceId"] for b in batches] == ["s1", "s2", "s3"]


def test_turns_of_one_session_accumulate_into_the_same_file(tmp_path):
    """A chained beat (beat 3 follows beat 2) is one session with two turns."""
    rec = create_recorder(str(tmp_path))
    rec.start_turn(context_id="ctx", task_id="t1", kind="utterance", prompt="first")
    rec.record_batch([_a2ui_part("s1")])
    rec.end_turn("completed")
    rec.start_turn(context_id="ctx", task_id="t2", kind="utterance", prompt="second")
    rec.record_batch([_a2ui_part("s2")])
    rec.end_turn("completed")

    assert len(list(tmp_path.glob("*.json"))) == 1
    session = json.loads(next(tmp_path.glob("*.json")).read_text(encoding="utf-8"))
    assert [t["prompt"] for t in session["turns"]] == ["first", "second"]


def test_the_file_is_written_at_the_end_of_every_turn_not_only_at_the_end(tmp_path):
    """A run that dies on beat 7 must still leave beats 1-6 on disk."""
    rec = create_recorder(str(tmp_path))
    rec.start_turn(context_id="ctx", task_id="t1", kind="utterance", prompt="first")
    rec.record_batch([_a2ui_part("s1")])
    rec.end_turn("completed")

    session = json.loads(next(tmp_path.glob("*.json")).read_text(encoding="utf-8"))
    assert len(session["turns"]) == 1


def test_a_failed_turn_is_recorded_with_its_outcome(tmp_path):
    """A failed paint is itself a fixture: the shell must prove it never reaches the stage."""
    rec = create_recorder(str(tmp_path))
    rec.start_turn(context_id="ctx", task_id="t", kind="utterance", prompt="p")
    rec.record_batch([_text_part("Sorry - I couldn't compose a valid interface for that request.")])
    rec.end_turn("apology")

    session = json.loads(next(tmp_path.glob("*.json")).read_text(encoding="utf-8"))
    assert session["turns"][0]["outcome"] == "apology"


def test_an_action_turn_records_the_action_it_was_driven_by(tmp_path):
    rec = create_recorder(str(tmp_path))
    action = {"name": "open-pull-request", "surfaceId": "prs", "context": {"number": 2093}}
    rec.start_turn(context_id="ctx", task_id="t", kind="surface-action", prompt="framed", action=action)
    rec.record_batch([_a2ui_part("s1")])
    rec.end_turn("completed")

    session = json.loads(next(tmp_path.glob("*.json")).read_text(encoding="utf-8"))
    turn = session["turns"][0]
    assert turn["kind"] == "surface-action"
    assert turn["action"] == action


def test_a_write_failure_never_takes_down_the_turn(tmp_path, monkeypatch):
    """Recording is diagnostics; a broken record dir must not fail an otherwise good turn."""
    rec = create_recorder(str(tmp_path / "nonexistent" / "deeper"))
    monkeypatch.setattr(
        SessionRecorder, "_write", lambda self: (_ for _ in ()).throw(OSError("disk full"))
    )
    rec.start_turn(context_id="ctx", task_id="t", kind="utterance", prompt="p")
    rec.record_batch([_a2ui_part("s1")])
    rec.end_turn("completed")  # must not raise


def test_recording_a_batch_before_a_turn_starts_is_ignored(tmp_path):
    """Defensive: an emission outside a turn must not crash the executor."""
    rec = create_recorder(str(tmp_path))
    rec.record_batch([_a2ui_part("s1")])
    rec.end_turn("completed")
    assert list(tmp_path.glob("*.json")) == []


@pytest.mark.parametrize("bad_context", ["../escape", "ctx/with/slash"])
def test_the_context_id_is_sanitized_into_the_filename(tmp_path, bad_context):
    """A context id reaches the filesystem; it must not be able to point outside the dir."""
    rec = create_recorder(str(tmp_path))
    rec.start_turn(context_id=bad_context, task_id="t", kind="utterance", prompt="p")
    rec.record_batch([_a2ui_part("s1")])
    rec.end_turn("completed")

    written = list(tmp_path.glob("*.json"))
    assert len(written) == 1
    assert written[0].parent == tmp_path


def test_two_conversations_land_in_two_files(tmp_path):
    """Turns are keyed by conversation; two contexts must never merge into one fixture."""
    rec = create_recorder(str(tmp_path))
    rec.start_turn(context_id="ctx-a", task_id="t1", kind="utterance", prompt="a")
    rec.record_batch([_a2ui_part("s1")])
    rec.end_turn("completed")
    rec.start_turn(context_id="ctx-b", task_id="t2", kind="utterance", prompt="b")
    rec.record_batch([_a2ui_part("s2")])
    rec.end_turn("completed")

    written = sorted(p.name for p in tmp_path.glob("*.json"))
    assert written == ["session-ctx-a.json", "session-ctx-b.json"]
    a = json.loads((tmp_path / "session-ctx-a.json").read_text(encoding="utf-8"))
    b = json.loads((tmp_path / "session-ctx-b.json").read_text(encoding="utf-8"))
    assert [t["prompt"] for t in a["turns"]] == ["a"]
    assert [t["prompt"] for t in b["turns"]] == ["b"]
