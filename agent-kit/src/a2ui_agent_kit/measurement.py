"""Per-request measurement of a model turn: time to first token, generation time, usage.

a2uiverse task-17.3. A turn is several requests to the model — a tool round trip is one,
the painting generation another, a retry adds more — and the prompt-size gate (phase-17
decision 9) asks about each one's prefill, so the grain is the request: one record each,
with the attempt it belongs to and its index within the attempt.

The instants come from ADK's model callbacks, the one place every request passes.
`before_model` marks the start, as the request leaves for the provider. `after_model` sees
every response — the partial chunks and the aggregate the closed stream produces — and marks
the first content that is not a thought (text or a tool call, so thinking time counts toward
the time to first token on Gemini and on Claude alike), the end, and the usage. The executor
opens a `TurnMeasurement` per turn and binds it to the context; the callbacks find it there,
so an agent run outside a turn measures nothing.

A request closes when the next one starts or the turn's records are read, not on any one
response: ADK's Gemini stream yields a function call and then the closing aggregate as two
responses, neither marked partial, so no single response is the end of a request.

Measurement is diagnostics, as the recorder is: nothing here raises into a turn.
"""

from __future__ import annotations

import contextvars
import logging
import time
from collections.abc import Callable
from typing import Any

logger = logging.getLogger(__name__)

# ADK normalises both providers' usage into one shape; these four counts are the ones that
# read (decision 3). A count the provider did not give is left out of the record.
_USAGE_COUNTS = (
    ("prompt_token_count", "promptTokens"),
    ("candidates_token_count", "outputTokens"),
    ("thoughts_token_count", "thoughtsTokens"),
    ("cached_content_token_count", "cachedTokens"),
)


class _Request:
    """One request to the model, as the responses fill it in."""

    def __init__(self, attempt: int, index: int, start_ms: int) -> None:
        self.attempt = attempt
        self.index = index
        self.start_ms = start_ms
        self.first_token_ms: int | None = None
        self.end_ms: int | None = None
        self.saw_text = False
        self.tools: list[str] = []
        self.usage: dict[str, int] | None = None
        self.logged = False

    def take(self, response: Any, now_ms: int) -> None:
        content = getattr(response, "content", None)
        for part in getattr(content, "parts", None) or []:
            if getattr(part, "thought", False):
                continue  # reasoning streamed as thought parts: not the answer, not a token
            call = getattr(part, "function_call", None)
            if call is not None:
                if self.first_token_ms is None:
                    self.first_token_ms = now_ms
                name = getattr(call, "name", None)
                if name and name not in self.tools:
                    self.tools.append(name)
            elif getattr(part, "text", None):
                if self.first_token_ms is None:
                    self.first_token_ms = now_ms
                self.saw_text = True
        usage = getattr(response, "usage_metadata", None)
        if usage is not None:
            counts = {
                key: value
                for field, key in _USAGE_COUNTS
                if (value := getattr(usage, field, None)) is not None
            }
            if counts:
                self.usage = counts
        if not getattr(response, "partial", None):
            # An aggregate: the request's end as far as this response knows. A later aggregate
            # of the same request (Gemini's close after a function call) moves it.
            self.end_ms = now_ms

    @property
    def ended(self) -> str:
        if self.tools:
            return "toolCall"
        if self.saw_text:
            return "text"
        return "error"

    def record(self) -> dict:
        record: dict = {"attempt": self.attempt, "index": self.index, "startMs": self.start_ms}
        if self.first_token_ms is not None:
            record["firstTokenMs"] = self.first_token_ms
        if self.end_ms is not None:
            record["endMs"] = self.end_ms
        if self.first_token_ms is not None:
            record["timeToFirstTokenMs"] = self.first_token_ms - self.start_ms
            if self.end_ms is not None:
                record["generationMs"] = self.end_ms - self.first_token_ms
        if self.end_ms is not None:
            record["ended"] = self.ended
        if self.tools:
            record["tools"] = list(self.tools)
        if self.usage:
            record["usage"] = dict(self.usage)
        return record

    def log(self) -> None:
        if self.logged:
            return
        self.logged = True
        first = (
            f"first token {self.first_token_ms - self.start_ms} ms"
            if self.first_token_ms is not None
            else "no first token"
        )
        generation = (
            f"generation {self.end_ms - self.first_token_ms} ms"
            if self.first_token_ms is not None and self.end_ms is not None
            else "no end"
        )
        ended = f"ended in {self.ended}" if self.end_ms is not None else "still open"
        if self.tools:
            ended += f" ({', '.join(self.tools)})"
        if self.usage:
            counts = [
                f"{self.usage[key]} {word}"
                for key, word in (
                    ("promptTokens", "prompt"),
                    ("outputTokens", "output"),
                    ("thoughtsTokens", "thoughts"),
                    ("cachedTokens", "cached"),
                )
                if key in self.usage
            ]
            usage = " / ".join(counts) + " tokens"
        else:
            usage = "no usage reported"
        logger.info(
            "request %d.%d: %s, %s, %s, %s",
            self.attempt,
            self.index,
            first,
            generation,
            ended,
            usage,
        )


class TurnMeasurement:
    """The requests of one turn, on the turn's clock.

    `started` is the turn's origin on `clock` — the same instant the recorder's batches
    offset from, so a request lines up with the parts that left during it.
    """

    def __init__(self, started: float, clock: Callable[[], float] = time.monotonic) -> None:
        self._started = started
        self._clock = clock
        self._attempt = 0
        self._index = 0
        self._closed: list[_Request] = []
        self._open: _Request | None = None

    def _now_ms(self) -> int:
        return int((self._clock() - self._started) * 1000)

    def begin_attempt(self, attempt: int) -> None:
        """Stamps the requests that follow with `attempt`; the index restarts."""
        self._attempt = attempt
        self._index = 0

    def request_started(self) -> None:
        """A request leaves for the provider: the one before it is closed."""
        self._close_open()
        self._index += 1
        self._open = _Request(self._attempt, self._index, self._now_ms())

    def response(self, llm_response: Any) -> None:
        """A response from the provider, a partial chunk or an aggregate, for the open request."""
        if self._open is None:
            return  # a response outside a request: nothing to attach it to
        self._open.take(llm_response, self._now_ms())

    def records(self) -> list[dict]:
        """Every request's record, the open one as it stands; each logged once."""
        for request in self._closed:
            request.log()
        if self._open is not None:
            self._open.log()
        records = [request.record() for request in self._closed]
        if self._open is not None:
            records.append(self._open.record())
        return records

    def _close_open(self) -> None:
        if self._open is None:
            return
        self._open.log()
        self._closed.append(self._open)
        self._open = None


_current: contextvars.ContextVar[TurnMeasurement | None] = contextvars.ContextVar(
    "a2ui_agent_kit.measurement", default=None
)


def bind_measurement(measurement: TurnMeasurement) -> contextvars.Token:
    """Makes `measurement` the one the callbacks feed, for this turn's context."""
    return _current.set(measurement)


def unbind_measurement(token: contextvars.Token) -> None:
    _current.reset(token)


def current_measurement() -> TurnMeasurement | None:
    return _current.get()


def before_model(callback_context, llm_request) -> None:  # noqa: ANN001, ARG001 - ADK's shape
    """ADK's before-model callback: the request is leaving for the provider."""
    measurement = _current.get()
    if measurement is None:
        return None
    try:
        measurement.request_started()
    except Exception:  # diagnostics: never into the turn
        logger.debug("measurement failed at a request's start", exc_info=True)
    return None


def after_model(callback_context, llm_response) -> None:  # noqa: ANN001, ARG001 - ADK's shape
    """ADK's after-model callback: one response, partial or the aggregate."""
    measurement = _current.get()
    if measurement is None:
        return None
    try:
        measurement.response(llm_response)
    except Exception:  # diagnostics: never into the turn
        logger.debug("measurement failed on a response", exc_info=True)
    return None
