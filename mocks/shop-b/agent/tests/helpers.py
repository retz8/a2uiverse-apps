"""The kit's in-process harness (`a2ui_agent_kit.testing`), bound to this app's executor.

The executor speaks the app's A2UI versions and is given no card, so every answer it drives
is stamped in the newest of them.
"""

from __future__ import annotations

from a2ui_agent_kit.executor_deterministic import DeterministicAgentExecutor
from a2ui_agent_kit.testing import run_executor as _run_executor
from a2ui_agent_kit.testing import run_executor_text as _run_executor_text

from app.config import CONFIG
from app.responses import build_response, build_text_response


def _executor() -> DeterministicAgentExecutor:
    return DeterministicAgentExecutor(
        build_response, build_text_response, versions=CONFIG.a2ui_versions
    )


async def run_executor(action: dict) -> list[dict]:
    return await _run_executor(_executor(), action)


async def run_executor_text(text: str) -> list[dict]:
    return await _run_executor_text(_executor(), text)
