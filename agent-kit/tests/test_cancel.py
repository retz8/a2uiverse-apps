"""The cancel path end to end (task 8.9), offline: ADK's run and the A2A server.

The executor-level half lives with the executors (test_llm_executor, test_executor).
Here: the kit's responder over a real ADK runner, a scripted model and a tool that never
returns; and the kit's A2A server over real HTTP, where the SDK's own cancel sequence
runs — `cancel()`, then the running execute() cancelled, then the task read back.
"""

import asyncio
import contextlib
import json
from types import SimpleNamespace

import httpx
import pytest
import uvicorn
from google.adk.agents import LlmAgent
from google.adk.models import BaseLlm, LlmResponse
from google.genai import types as genai_types
from pydantic import PrivateAttr

from a2ui_agent_kit import server
from a2ui_agent_kit.executor_llm import LlmAgentExecutor
from a2ui_agent_kit.responder import AdkLlmResponder

from .conftest import make_config

# ---- ADK's run -----------------------------------------------------------------------


class _ScriptedModel(BaseLlm):
    """Calls the tool on its first turn and answers in text on every later one."""

    model: str = "scripted"
    _calls: int = PrivateAttr(default=0)

    @property
    def calls(self) -> int:
        return self._calls

    async def generate_content_async(self, llm_request, stream=False):
        self._calls += 1
        if self._calls == 1:
            part = genai_types.Part(
                function_call=genai_types.FunctionCall(name="list_pull_requests", args={})
            )
        else:
            part = genai_types.Part(text="Here are your pull requests.")
        yield LlmResponse(content=genai_types.Content(role="model", parts=[part]))


async def _drain(stream) -> str:
    return "".join([chunk async for chunk in stream])


@pytest.mark.asyncio
async def test_a_cancel_mid_tool_call_ends_adk_s_run_and_calls_the_model_no_further():
    tool_waiting = asyncio.Event()
    tool_cancelled: list[bool] = []

    async def list_pull_requests() -> dict:
        """Lists open pull requests from a backend that never answers."""
        tool_waiting.set()
        try:
            await asyncio.Event().wait()
        except asyncio.CancelledError:
            tool_cancelled.append(True)
            raise
        return {}

    model = _ScriptedModel()
    responder = AdkLlmResponder(LlmAgent(name="t", model=model, tools=[list_pull_requests]))
    before = asyncio.all_tasks()

    run = asyncio.create_task(_drain(responder.stream("show me open PRs", context_id="ctx")))
    await asyncio.wait_for(tool_waiting.wait(), timeout=5)
    run.cancel()  # what the SDK does to execute(), which is awaiting this stream
    with pytest.raises(asyncio.CancelledError):
        await run
    await asyncio.sleep(0.05)

    assert tool_cancelled == [True]  # the tool's wait dropped
    assert model.calls == 1  # the model called no further
    assert not {t for t in asyncio.all_tasks() - before if not t.done()}  # nothing left running

    # The conversation keeps the cancelled turn, its call left unanswered, and the next
    # turn on it runs (task-8.9 decision 5).
    reply = await asyncio.wait_for(
        _drain(responder.stream("never mind, anything new?", context_id="ctx")), timeout=5
    )
    assert reply == "Here are your pull requests."


# ---- the A2A server --------------------------------------------------------------------


class _EndlessResponder:
    """A model that streams prose for ever, so updates are in flight when a cancel lands."""

    def __init__(self):
        self.calls = 0
        self.closed = asyncio.Event()

    async def stream(self, prompt, correction=None, context_id=None):
        self.calls += 1
        try:
            while True:
                yield "more prose "
                await asyncio.sleep(0.002)
        finally:
            self.closed.set()


@contextlib.asynccontextmanager
async def _serving(app):
    config = uvicorn.Config(app, host="127.0.0.1", port=0, log_level="warning", lifespan="off")
    uv = uvicorn.Server(config)
    serving = asyncio.create_task(uv.serve())
    while not uv.started:
        await asyncio.sleep(0.01)
    port = uv.servers[0].sockets[0].getsockname()[1]
    try:
        async with httpx.AsyncClient(base_url=f"http://127.0.0.1:{port}", timeout=10) as client:
            yield client
    finally:
        uv.should_exit = True
        await serving


def _rpc(method: str, params: dict) -> dict:
    return {"jsonrpc": "2.0", "id": method, "method": method, "params": params}


def _message(text: str) -> dict:
    return {
        "message": {
            "kind": "message",
            "messageId": "m1",
            "role": "user",
            "parts": [{"kind": "text", "text": text}],
        }
    }


@pytest.mark.asyncio
async def test_a_cancelled_stream_is_answered_canceled_its_run_ends_and_it_stays_canceled(
    tmp_path, monkeypatch
):
    responder = _EndlessResponder()
    config = make_config("basic", tmp_path)
    executor = LlmAgentExecutor(responder, config)
    monkeypatch.setattr(server, "resolve_executor", lambda _config, _mode: executor)
    app = server.build_app(config, "stub", "127.0.0.1", 0)

    async with _serving(app) as client:
        task_id, updates = None, 0
        # The orchestrator's order: close the stream, then send tasks/cancel.
        async with client.stream(
            "POST", "/", json=_rpc("message/stream", _message("show me open PRs"))
        ) as response:
            async for line in response.aiter_lines():
                if not line.startswith("data:"):
                    continue
                result = json.loads(line.removeprefix("data:"))["result"]
                if result["kind"] == "task":
                    task_id = result["id"]
                elif result["kind"] == "status-update":
                    updates += 1
                if updates == 5:
                    break
        assert task_id

        cancelled = (await client.post("/", json=_rpc("tasks/cancel", {"id": task_id}))).json()
        assert cancelled["result"]["status"]["state"] == "canceled"
        assert cancelled["result"]["status"].get("message") is None

        await asyncio.wait_for(responder.closed.wait(), timeout=5)  # the run ended
        await asyncio.sleep(0.2)  # the stream's background reader drains what it held
        got = (await client.post("/", json=_rpc("tasks/get", {"id": task_id}))).json()
        assert got["result"]["status"]["state"] == "canceled"
        assert responder.calls == 1  # no further attempt


@pytest.mark.asyncio
async def test_a_task_that_already_completed_is_answered_not_cancelable(tmp_path):
    config = make_config("basic", tmp_path, build_text_response=lambda _text: [])
    app = server.build_app(config, "deterministic", "127.0.0.1", 0)

    async with _serving(app) as client:
        sent = (await client.post("/", json=_rpc("message/send", _message("hello")))).json()
        assert sent["result"]["status"]["state"] == "completed"

        refused = (
            await client.post("/", json=_rpc("tasks/cancel", {"id": sent["result"]["id"]}))
        ).json()
        assert refused["error"]["code"] == -32002  # TaskNotCancelableError
