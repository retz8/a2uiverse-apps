"""LLM responder abstraction: streams model text tokens; ADK-backed at runtime.

The executor depends only on the LlmResponder protocol, so its stream/validate/retry
logic is L0-testable with a fake responder — no live model. AdkLlmResponder is the
real implementation wired by the server; it is exercised by the task's manual live run.
"""

from __future__ import annotations

import logging
from typing import AsyncIterator, Optional, Protocol, runtime_checkable

logger = logging.getLogger(__name__)


class ModelTurnError(RuntimeError):
    """A model turn ended in an error with no text produced.

    E.g. Gemini aborting generation with finish_reason=MALFORMED_FUNCTION_CALL: the
    turn yields error events and zero output. Raised by the responder stream so the
    executor can react to the actual failure instead of misreading the empty stream
    as "no A2UI surface found".
    """

    def __init__(self, error_code):
        self.error_code = str(error_code)
        super().__init__(f"model turn failed with no text: {self.error_code}")


@runtime_checkable
class LlmResponder(Protocol):
    def stream(
        self,
        prompt: str,
        correction: Optional[str] = None,
        context_id: Optional[str] = None,
    ) -> AsyncIterator[str]:
        """Yields raw model text tokens for `prompt`.

        When `correction` is set, it is a validation-error message appended to the
        same conversation so the model can repair its previous A2UI output.

        `context_id` keys the model conversation: calls sharing one context_id
        continue one session — follow-up prompts and correction retries alike — so
        the model sees the prior turns. None gets a fresh session per call.
        """
        ...


async def _stream_agent_text(events: AsyncIterator) -> AsyncIterator[str]:
    """Yields model text from an ADK event stream once, whatever the streaming mode.

    In SSE mode ADK emits `partial=True` chunk events and then a final aggregated
    event (`partial` falsy) repeating the full text; yielding both would double the
    response. Emit text from partial chunks; once any partial has been seen, skip the
    trailing aggregate. When no partial is ever seen (a non-streaming single final
    event), emit it — so the helper is correct in both modes.
    """
    saw_partial = False
    saw_text = False
    last_finish = None
    last_error_code = None
    async for event in events:
        # A blocked or failed generation surfaces only here — never drop it silently.
        error_code = getattr(event, "error_code", None)
        error_message = getattr(event, "error_message", None)
        if error_code or error_message:
            logger.warning("model event error: %s %s", error_code, error_message)
        if error_code is not None:
            last_error_code = error_code
        finish = getattr(event, "finish_reason", None)
        if finish is not None:
            last_finish = finish
        partial = getattr(event, "partial", None)
        if not partial:
            # Name the turn shape in the logs: one attempt can span several model
            # requests (tool round-trips before the final generation). ADK emits a
            # function-call event twice in SSE mode — a partial chunk plus the
            # non-partial aggregate it executes; log the aggregate only, mirroring
            # ADK's own execution rule.
            get_calls = getattr(event, "get_function_calls", None)
            for call in (get_calls() if get_calls else None) or []:
                logger.info("turn: tool call %s(%s)", call.name, call.args)
            get_responses = getattr(event, "get_function_responses", None)
            for response in (get_responses() if get_responses else None) or []:
                logger.info("turn: tool result %s", response.name)
        if not partial and saw_partial:
            continue  # the aggregated final event duplicates the streamed chunks
        if partial:
            saw_partial = True
        content = getattr(event, "content", None)
        if content and getattr(content, "parts", None):
            for part in content.parts:
                chunk = getattr(part, "text", None)
                if chunk:
                    saw_text = True
                    yield chunk
    if not saw_text:
        # E.g. thinking consumed the output budget: the executor would only report
        # "no A2UI surface found" with no trace of why the stream was empty.
        logger.warning(
            "model stream ended with no text (finish_reason=%s)", last_finish
        )
        if last_error_code is not None:
            # The turn errored out before any token (e.g. MALFORMED_FUNCTION_CALL):
            # raise the failure class so the executor's retry can address it. A
            # stream that produced text never raises — end-of-stream validation
            # owns that outcome.
            raise ModelTurnError(last_error_code)


class AdkLlmResponder:
    """Runs the live LlmAgent through an ADK Runner with in-memory services.

    The agent and app_name are injected (modes.py builds the agent from the config);
    the responder itself is vendor-free.
    """

    def __init__(self, llm_agent, app_name: str = "a2ui_live"):
        from google.adk.artifacts import InMemoryArtifactService
        from google.adk.memory import InMemoryMemoryService
        from google.adk.runners import Runner
        from google.adk.sessions import InMemorySessionService

        self._app_name = app_name
        self._agent = llm_agent
        self._session_service = InMemorySessionService()
        self._runner = Runner(
            app_name=app_name,
            agent=self._agent,
            session_service=self._session_service,
            artifact_service=InMemoryArtifactService(),
            memory_service=InMemoryMemoryService(),
        )
        self._user_id = "live-user"
        # One ADK session per A2A conversation (context_id), so every message of a
        # chat — follow-ups and correction retries — continues the same model
        # conversation. In-memory and unbounded, like the rest of the demo stack.
        self._sessions: dict[str, str] = {}

    async def _resolve_session(self, context_id: Optional[str]) -> str:
        """Returns the ADK session id for this conversation, creating it on first
        sight. A None context_id (no conversation to key on) gets a throwaway
        session per call."""
        if context_id is not None and context_id in self._sessions:
            return self._sessions[context_id]
        session = await self._session_service.create_session(
            app_name=self._app_name, user_id=self._user_id
        )
        if context_id is not None:
            self._sessions[context_id] = session.id
        return session.id

    async def stream(
        self,
        prompt: str,
        correction: Optional[str] = None,
        context_id: Optional[str] = None,
    ) -> AsyncIterator[str]:
        from google.adk.agents.run_config import RunConfig, StreamingMode
        from google.genai import types as genai_types

        session_id = await self._resolve_session(context_id)
        text = correction if correction is not None else prompt
        message = genai_types.Content(
            role="user", parts=[genai_types.Part(text=text)]
        )
        logger.info("run_async begin: session=%s text=%r", session_id, text[:80])
        # SSE streaming mode makes the Gemini call stream tokens (stream: True), so the
        # parts flow through the incremental parser / per-part executor events as they
        # arrive; _stream_agent_text drops the trailing aggregated duplicate SSE emits.
        events = self._runner.run_async(
            user_id=self._user_id,
            session_id=session_id,
            new_message=message,
            run_config=RunConfig(streaming_mode=StreamingMode.SSE),
        )
        text_stream = _stream_agent_text(events)
        try:
            async for chunk in text_stream:
                yield chunk
            logger.info("run_async end: session=%s", session_id)
        finally:
            # `async for` never closes its iterator: when the executor aborts this
            # generator mid-stream, the inner generators would be left suspended for
            # GC finalization in a foreign context (late cancellation, otel detach
            # noise). Close the chain innermost-last, in-task; a no-op when the
            # stream was consumed to the end.
            await text_stream.aclose()
            await events.aclose()
