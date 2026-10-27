"""L0 measurement tests: one record per model request, on scripted ADK responses, no model.

a2uiverse task-17.3. A turn is several requests to the model — a tool round trip, the
painting generation, a retry's — and each gets a record: the time to its first token, the
generation time after it and its token usage. The instants come from ADK's model callbacks:
before marks the start; after sees every response, partial chunks and the aggregate alike.
"""

from __future__ import annotations

import logging

from google.adk.models.llm_response import LlmResponse
from google.genai import types as genai_types

from a2ui_agent_kit import measurement
from a2ui_agent_kit.measurement import (
    TurnMeasurement,
    after_model,
    before_model,
    bind_measurement,
    unbind_measurement,
)


class _Clock:
    """A clock the test advances by hand, in seconds."""

    def __init__(self) -> None:
        self.now = 0.0

    def __call__(self) -> float:
        return self.now


def _usage(prompt=None, output=None, thoughts=None, cached=None):
    return genai_types.GenerateContentResponseUsageMetadata(
        prompt_token_count=prompt,
        candidates_token_count=output,
        thoughts_token_count=thoughts,
        cached_content_token_count=cached,
    )


def _text(text: str, *, partial=True, thought=False, usage=None) -> LlmResponse:
    part = genai_types.Part(text=text, thought=True) if thought else genai_types.Part(text=text)
    return LlmResponse(
        content=genai_types.Content(role="model", parts=[part]),
        partial=partial,
        usage_metadata=usage,
    )


def _call(name: str, usage=None) -> LlmResponse:
    """A function-call response as ADK's Gemini stream yields it: not marked partial."""
    part = genai_types.Part(function_call=genai_types.FunctionCall(name=name, args={}))
    return LlmResponse(
        content=genai_types.Content(role="model", parts=[part]),
        partial=None,
        usage_metadata=usage,
    )


def _aggregate(usage=None, error_code=None) -> LlmResponse:
    """The aggregate the closed stream produces: no new content, the usage, any error."""
    return LlmResponse(content=None, partial=False, usage_metadata=usage, error_code=error_code)


def _turn(clock: _Clock) -> TurnMeasurement:
    turn = TurnMeasurement(started=clock.now, clock=clock)
    turn.begin_attempt(1)
    return turn


def test_a_tool_call_request_then_a_text_request_make_two_records():
    clock = _Clock()
    turn = _turn(clock)

    turn.request_started()
    clock.now = 1.2
    turn.response(_call("list_issues", usage=_usage(prompt=7000, output=40)))
    clock.now = 1.3
    turn.response(_aggregate(usage=_usage(prompt=7000, output=40)))

    clock.now = 2.0
    turn.request_started()
    clock.now = 3.8
    turn.response(_text("Here "))
    clock.now = 5.0
    turn.response(_text("you go"))
    clock.now = 9.8
    turn.response(_aggregate(usage=_usage(prompt=7200, output=650, thoughts=0)))

    first, second = turn.records()
    assert first == {
        "attempt": 1,
        "index": 1,
        "startMs": 0,
        "firstTokenMs": 1200,
        "endMs": 1300,
        "timeToFirstTokenMs": 1200,
        "generationMs": 100,
        "ended": "toolCall",
        "tools": ["list_issues"],
        "usage": {"promptTokens": 7000, "outputTokens": 40},
    }
    assert second == {
        "attempt": 1,
        "index": 2,
        "startMs": 2000,
        "firstTokenMs": 3800,
        "endMs": 9800,
        "timeToFirstTokenMs": 1800,
        "generationMs": 6000,
        "ended": "text",
        "usage": {"promptTokens": 7200, "outputTokens": 650, "thoughtsTokens": 0},
    }


def test_the_offsets_are_on_the_turns_clock_not_the_requests():
    """The recorder's batches carry offsets from the turn's start; a request lines up with them."""
    clock = _Clock()
    clock.now = 10.0
    turn = TurnMeasurement(started=4.0, clock=clock)
    turn.begin_attempt(1)
    turn.request_started()
    clock.now = 11.0
    turn.response(_text("x", partial=False))
    (record,) = turn.records()
    assert record["startMs"] == 6000
    assert record["endMs"] == 7000


def test_a_thought_part_is_not_the_first_token():
    """Thinking time counts toward the time to first token, on either provider (decision 2)."""
    clock = _Clock()
    turn = _turn(clock)
    turn.request_started()
    clock.now = 1.0
    turn.response(_text("let me think", thought=True))
    clock.now = 2.5
    turn.response(_text("Here"))
    clock.now = 4.0
    turn.response(_aggregate(usage=_usage(prompt=10, output=5, thoughts=300)))
    (record,) = turn.records()
    assert record["firstTokenMs"] == 2500
    assert record["timeToFirstTokenMs"] == 2500
    assert record["generationMs"] == 1500
    assert record["usage"]["thoughtsTokens"] == 300


def test_usage_counts_are_absent_when_the_provider_gave_none():
    clock = _Clock()
    turn = _turn(clock)
    turn.request_started()
    turn.response(_text("a"))
    turn.response(_aggregate(usage=_usage(prompt=12)))
    turn.request_started()
    turn.response(_text("b"))
    turn.response(_aggregate())
    counted, uncounted = turn.records()
    assert counted["usage"] == {"promptTokens": 12}
    assert "usage" not in uncounted


def test_the_cached_prompt_count_is_kept():
    clock = _Clock()
    turn = _turn(clock)
    turn.request_started()
    turn.response(_text("a", partial=False, usage=_usage(prompt=9000, output=20, cached=8000)))
    (record,) = turn.records()
    assert record["usage"] == {"promptTokens": 9000, "outputTokens": 20, "cachedTokens": 8000}


def test_a_request_that_errored_with_no_content_has_no_first_token():
    clock = _Clock()
    turn = _turn(clock)
    turn.request_started()
    clock.now = 0.9
    turn.response(_aggregate(error_code="MALFORMED_FUNCTION_CALL"))
    (record,) = turn.records()
    assert record["ended"] == "error"
    assert record["endMs"] == 900
    for key in ("firstTokenMs", "timeToFirstTokenMs", "generationMs", "tools", "usage"):
        assert key not in record


def test_a_request_that_wrote_text_and_then_errored_ended_in_text():
    clock = _Clock()
    turn = _turn(clock)
    turn.request_started()
    turn.response(_text("half a sur"))
    turn.response(_aggregate(error_code="MAX_TOKENS"))
    (record,) = turn.records()
    assert record["ended"] == "text"


def test_several_tool_calls_in_one_request_are_all_named_once():
    clock = _Clock()
    turn = _turn(clock)
    turn.request_started()
    turn.response(_call("list_issues"))
    turn.response(_call("list_teams"))
    turn.response(_call("list_issues"))
    turn.response(_aggregate())
    (record,) = turn.records()
    assert record["ended"] == "toolCall"
    assert record["tools"] == ["list_issues", "list_teams"]


def test_the_index_restarts_with_each_attempt():
    clock = _Clock()
    turn = _turn(clock)
    turn.request_started()
    turn.response(_text("bad", partial=False))
    turn.begin_attempt(2)
    turn.request_started()
    turn.response(_text("good", partial=False))
    assert [(r["attempt"], r["index"]) for r in turn.records()] == [(1, 1), (2, 1)]


def test_an_aggregate_alone_is_a_request_whose_first_token_is_its_end():
    """A provider that does not stream answers in one piece: nothing was generated after it."""
    clock = _Clock()
    turn = _turn(clock)
    turn.request_started()
    clock.now = 3.0
    turn.response(_text("whole", partial=False, usage=_usage(prompt=1, output=2)))
    (record,) = turn.records()
    assert record["firstTokenMs"] == record["endMs"] == 3000
    assert record["generationMs"] == 0


def test_a_request_still_open_is_in_the_records_as_it_stands():
    """A turn cut off mid-request — cancel, a provider failure — keeps what it measured."""
    clock = _Clock()
    turn = _turn(clock)
    turn.request_started()
    clock.now = 2.0
    turn.response(_text("par"))
    (record,) = turn.records()
    assert record["startMs"] == 0
    assert record["firstTokenMs"] == 2000
    assert "endMs" not in record
    assert "ended" not in record


def test_records_can_be_read_more_than_once_without_duplicating():
    clock = _Clock()
    turn = _turn(clock)
    turn.request_started()
    turn.response(_text("a", partial=False))
    assert turn.records() == turn.records()
    assert len(turn.records()) == 1


def test_the_callbacks_measure_the_bound_turn():
    clock = _Clock()
    turn = _turn(clock)
    token = bind_measurement(turn)
    try:
        before_model(None, None)
        clock.now = 0.5
        after_model(None, _text("Here"))
        clock.now = 2.0
        after_model(None, _aggregate(usage=_usage(prompt=5, output=3)))
    finally:
        unbind_measurement(token)
    (record,) = turn.records()
    assert record["timeToFirstTokenMs"] == 500
    assert record["generationMs"] == 1500
    assert record["ended"] == "text"


def test_the_callbacks_do_nothing_when_no_turn_is_bound():
    assert measurement.current_measurement() is None
    assert before_model(None, None) is None
    assert after_model(None, _text("Here")) is None


def test_a_measurement_failure_never_raises():
    """The measurement is diagnostics: a response it cannot read must not fail the turn."""
    clock = _Clock()
    turn = _turn(clock)
    token = bind_measurement(turn)
    try:
        before_model(None, None)
        after_model(None, object())
        after_model(None, _aggregate())
    finally:
        unbind_measurement(token)
    (record,) = turn.records()
    assert record["ended"] == "error"


def test_a_closed_request_logs_one_line_with_its_numbers(caplog):
    clock = _Clock()
    turn = _turn(clock)
    turn.request_started()
    clock.now = 1.8
    turn.response(_text("Here"))
    clock.now = 9.8
    turn.response(_aggregate(usage=_usage(prompt=7200, output=650)))
    with caplog.at_level(logging.INFO, logger="a2ui_agent_kit.measurement"):
        turn.records()
    (line,) = [r.getMessage() for r in caplog.records]
    assert "request 1.1" in line
    assert "first token 1800 ms" in line
    assert "generation 8000 ms" in line
    assert "text" in line
    assert "7200 prompt" in line and "650 output" in line


def test_a_request_is_logged_once_however_often_the_records_are_read(caplog):
    clock = _Clock()
    turn = _turn(clock)
    turn.request_started()
    turn.response(_text("a", partial=False))
    with caplog.at_level(logging.INFO, logger="a2ui_agent_kit.measurement"):
        turn.records()
        turn.records()
        turn.request_started()
        turn.response(_text("b", partial=False))
        turn.records()
    assert len(caplog.records) == 2
