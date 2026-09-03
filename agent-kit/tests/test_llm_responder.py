"""L0 responder tests: the ADK event-stream dedup helper + session keying, no live model.

`_stream_agent_text` is the SSE-safe text extractor `AdkLlmResponder.stream` delegates
to. In SSE mode ADK emits partial chunk events then a final aggregated event repeating
the full text; the helper must emit the text once. These tests feed it fake Event-like
objects so the policy is verified without constructing a live model call. Session tests
run on a real AdkLlmResponder over a minimal LlmAgent — construction is offline.
"""

import logging
from types import SimpleNamespace

import pytest

from a2ui_agent_kit.responder import AdkLlmResponder, ModelTurnError, _stream_agent_text


def _event(text, partial):
    """A minimal ADK-Event stand-in: one text part plus the streaming `partial` flag."""
    return SimpleNamespace(
        content=SimpleNamespace(parts=[SimpleNamespace(text=text)]),
        partial=partial,
    )


async def _aiter(events):
    for event in events:
        yield event


async def _collect(events):
    return [chunk async for chunk in _stream_agent_text(_aiter(events))]


@pytest.mark.asyncio
async def test_sse_stream_drops_the_aggregated_duplicate():
    # SSE: partial chunks followed by a final aggregate carrying the full text again.
    events = [
        _event("Hel", partial=True),
        _event("lo", partial=True),
        _event("Hello", partial=None),  # aggregated final — must be skipped
    ]
    chunks = await _collect(events)
    assert chunks == ["Hel", "lo"]
    assert "".join(chunks) == "Hello"  # full text once, not doubled


@pytest.mark.asyncio
async def test_single_non_partial_event_is_emitted():
    # Non-streaming fallback: one final event, no partials seen — must still be emitted.
    chunks = await _collect([_event("Hello", partial=None)])
    assert chunks == ["Hello"]


def _tool_event(calls=(), responses=()):
    """An ADK-Event stand-in for a tool-call turn: no text, function call/response parts."""
    return SimpleNamespace(
        content=None,
        partial=None,
        get_function_calls=lambda: list(calls),
        get_function_responses=lambda: list(responses),
    )


@pytest.mark.asyncio
async def test_tool_call_turns_are_logged(caplog):
    call = SimpleNamespace(name="list_pull_requests", args={"state": "open"})
    events = [_tool_event(calls=[call]), _event("Hello", partial=None)]
    with caplog.at_level(logging.INFO, logger="a2ui_agent_kit.responder"):
        chunks = await _collect(events)
    assert chunks == ["Hello"]  # the tool turn yields no text
    logged = "\n".join(r.getMessage() for r in caplog.records)
    assert "tool call" in logged
    assert "list_pull_requests" in logged and "state" in logged


@pytest.mark.asyncio
async def test_tool_result_turns_are_logged(caplog):
    response = SimpleNamespace(name="get_pull_request")
    events = [_tool_event(responses=[response]), _event("Hello", partial=None)]
    with caplog.at_level(logging.INFO, logger="a2ui_agent_kit.responder"):
        chunks = await _collect(events)
    assert chunks == ["Hello"]
    logged = "\n".join(r.getMessage() for r in caplog.records)
    assert "tool result" in logged and "get_pull_request" in logged


@pytest.mark.asyncio
async def test_tool_calls_are_logged_once_despite_partial_duplicates(caplog):
    # ADK emits a function-call event twice in SSE mode — a partial chunk event and
    # the non-partial aggregate it acts on. The log line must fire once (aggregate).
    call = SimpleNamespace(name="list_pull_requests", args={"state": "open"})
    partial_call = SimpleNamespace(
        content=None,
        partial=True,
        get_function_calls=lambda: [call],
        get_function_responses=lambda: [],
    )
    events = [partial_call, _tool_event(calls=[call]), _event("Hi", partial=True)]
    with caplog.at_level(logging.INFO, logger="a2ui_agent_kit.responder"):
        chunks = await _collect(events)
    assert chunks == ["Hi"]
    assert sum("tool call" in r.getMessage() for r in caplog.records) == 1


@pytest.mark.asyncio
async def test_model_error_events_are_logged(caplog):
    # An event carrying an error must not vanish silently — it is the only trace of
    # a blocked or failed generation.
    err_event = SimpleNamespace(
        content=None, partial=None, error_code="BLOCKED", error_message="safety"
    )
    with caplog.at_level(logging.WARNING, logger="a2ui_agent_kit.responder"):
        with pytest.raises(ModelTurnError):  # error-only stream also raises
            await _collect([err_event])
    logged = "\n".join(r.getMessage() for r in caplog.records)
    assert "BLOCKED" in logged and "safety" in logged


@pytest.mark.asyncio
async def test_stream_with_no_text_logs_the_finish_reason(caplog):
    # A stream that ends with no text at all (e.g. thinking ate the token budget) must
    # say so, with the finish_reason, instead of failing invisibly downstream.
    events = [SimpleNamespace(content=None, partial=None, finish_reason="MAX_TOKENS")]
    with caplog.at_level(logging.WARNING, logger="a2ui_agent_kit.responder"):
        chunks = await _collect(events)
    assert chunks == []
    logged = "\n".join(r.getMessage() for r in caplog.records)
    assert "no text" in logged and "MAX_TOKENS" in logged


@pytest.mark.asyncio
async def test_erroring_empty_stream_raises_a_model_turn_error():
    # A turn Gemini aborts (e.g. finish_reason=MALFORMED_FUNCTION_CALL) yields error
    # events and no text; silently ending the stream lets the executor misread it as
    # "no A2UI surface found" and burn the retry on a phantom-validation correction.
    err_event = SimpleNamespace(
        content=None,
        partial=None,
        error_code="MALFORMED_FUNCTION_CALL",
        error_message=None,
        finish_reason="MALFORMED_FUNCTION_CALL",
    )
    with pytest.raises(ModelTurnError) as excinfo:
        await _collect([err_event])
    assert "MALFORMED_FUNCTION_CALL" in excinfo.value.error_code


@pytest.mark.asyncio
async def test_a_stream_that_produced_text_never_raises_on_error_events():
    # Once text streamed, end-of-stream validation owns the outcome; a stray error
    # event must not discard tokens the client already saw.
    err_event = SimpleNamespace(
        content=None, partial=None, error_code="BLOCKED", error_message="safety"
    )
    chunks = await _collect([_event("Hello", partial=None), err_event])
    assert chunks == ["Hello"]


@pytest.mark.asyncio
async def test_empty_stream_without_error_code_does_not_raise():
    # No text and no error (e.g. thinking ate the budget): keep the warning-only path.
    events = [SimpleNamespace(content=None, partial=None, finish_reason="MAX_TOKENS")]
    assert await _collect(events) == []


def _offline_responder() -> AdkLlmResponder:
    """An AdkLlmResponder over a minimal agent — no prompt assembly, no model call."""
    from google.adk.agents import LlmAgent

    return AdkLlmResponder(llm_agent=LlmAgent(name="t", model="gemini-2.5-flash"))


@pytest.mark.asyncio
async def test_aborting_the_stream_closes_the_adk_event_generator():
    # `async for` never closes its iterator: when the executor aborts the responder
    # stream mid-flight (parser error), the ADK run_async generator must be closed
    # in-task by the responder's own finally — left to GC finalization it unwinds in
    # a foreign context (late "root node cancelled", otel detach noise).
    responder = _offline_responder()
    closed = []

    def fake_run_async(**_kwargs):
        async def _events():
            try:
                yield SimpleNamespace(
                    content=SimpleNamespace(parts=[SimpleNamespace(text="a")]),
                    partial=True,
                )
                yield SimpleNamespace(
                    content=SimpleNamespace(parts=[SimpleNamespace(text="b")]),
                    partial=True,
                )
            finally:
                closed.append(True)

        return _events()

    responder._runner = SimpleNamespace(run_async=fake_run_async)
    stream = responder.stream("hi", context_id="ctx-abort")
    assert await stream.__anext__() == "a"
    await stream.aclose()
    assert closed == [True]


@pytest.mark.asyncio
async def test_same_context_id_reuses_the_adk_session():
    # Session continuity: every message of one A2A conversation (same context_id)
    # continues one ADK session, so the model sees the prior turns.
    responder = _offline_responder()
    first = await responder._resolve_session("ctx-1")
    again = await responder._resolve_session("ctx-1")
    assert first == again


@pytest.mark.asyncio
async def test_distinct_context_ids_get_distinct_sessions():
    responder = _offline_responder()
    assert await responder._resolve_session("ctx-1") != await responder._resolve_session(
        "ctx-2"
    )


@pytest.mark.asyncio
async def test_missing_context_id_gets_a_fresh_session_per_call():
    responder = _offline_responder()
    assert await responder._resolve_session(None) != await responder._resolve_session(
        None
    )
