"""The person's time zone, read from the sentence A2UIVerse adds to a request's words, and
bound for the run, the conversation keeping the last one stated."""

from __future__ import annotations

from a2a.server.agent_execution import RequestContext
from a2a.server.context import ServerCallContext
from a2a.types import Message, Role, SendMessageRequest

from a2ui_agent_kit.executor_llm import LlmAgentExecutor
from a2ui_agent_kit.local_time import current_time_zone, time_zone_stated
from a2ui_agent_kit.wire import text_part
from tests.conftest import make_config

SEOUL = (
    "What's on today? The person's local time is Friday 9 October 2026, 14:20 (Asia/Seoul)."
)


def test_the_zone_is_read_from_the_sentence():
    assert time_zone_stated(SEOUL) == "Asia/Seoul"
    assert (
        time_zone_stated(
            "The person's local time is Monday 2 November 2026, 09:05 (America/Argentina/Buenos_Aires)."
        )
        == "America/Argentina/Buenos_Aires"
    )


def test_no_sentence_or_a_zone_that_does_not_read_states_none():
    assert time_zone_stated("What's on today?") is None
    assert time_zone_stated("") is None
    assert time_zone_stated("The person's local time is Friday 9 October 2026, 14:20 (Mars/Olympus).") is None


class _Seen:
    """A model run that notes, by the request's first words, the zone bound while it runs."""

    def __init__(self):
        self.zones: dict[str, str | None] = {}

    async def stream(self, prompt, correction=None, context_id=None):
        self.zones[" ".join(prompt.split()[:2])] = current_time_zone()
        yield "done"


class _Events:
    def __init__(self):
        self.events = []

    async def enqueue_event(self, event):
        self.events.append(event)


def _request(text: str, context_id: str, task_id: str) -> RequestContext:
    message = Message(message_id=task_id, role=Role.ROLE_USER, parts=[text_part(text)])
    return RequestContext(
        ServerCallContext(state={}),
        SendMessageRequest(message=message),
        task_id=task_id,
        context_id=context_id,
    )


async def test_a_run_sees_the_zone_its_conversation_last_stated(tmp_path):
    seen = _Seen()
    executor = LlmAgentExecutor(seen, make_config("basic", tmp_path))
    await executor.execute(_request(SEOUL, "c1", "t1"), _Events())
    await executor.execute(_request("And tomorrow?", "c1", "t2"), _Events())
    await executor.execute(_request("Anything else today?", "c2", "t3"), _Events())
    assert seen.zones == {
        "What's on": "Asia/Seoul",
        "And tomorrow?": "Asia/Seoul",
        "Anything else": None,
    }
    assert current_time_zone() is None
