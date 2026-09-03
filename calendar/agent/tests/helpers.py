"""The kit's in-process harness (`a2uiverse_kit.testing`), bound to this app's executor."""

from __future__ import annotations

from a2uiverse_kit.executor_deterministic import DeterministicAgentExecutor
from a2uiverse_kit.testing import run_executor as _run_executor
from a2uiverse_kit.testing import run_executor_text as _run_executor_text

from app.responses import build_response, build_text_response


def _executor() -> DeterministicAgentExecutor:
    return DeterministicAgentExecutor(build_response, build_text_response)


async def run_executor(action: dict) -> list[dict]:
    return await _run_executor(_executor(), action)


async def run_executor_text(text: str) -> list[dict]:
    return await _run_executor_text(_executor(), text)
