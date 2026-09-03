"""Stub __DISPLAY_NAME__ toolset: canned, real-shaped data for `--mode stub`.

The stub exists so prompt iteration and client work need not touch the vendor or consume
call allowance. It is always an explicit opt-in (`--mode stub`). Its fixtures should be
derived from recorded live payloads rather than invented — that is what keeps the canned
data real-shaped.

TODO: replace `get_greeting` with a mirror of the live tool surface this agent holds, one
function per tool, each reading its fixture from app/fixtures/stub/. Writes are accepted
and acknowledged but change nothing.
"""

from __future__ import annotations

from pathlib import Path

from a2ui_agent_kit.responses import stub_fixture_loader

_FIXTURES = Path(__file__).resolve().parent / "fixtures" / "stub"

_fixture = stub_fixture_loader(
    _FIXTURES,
    hint="The stub corpus is derived from a recorded live run; see agent/README.md.",
)


def get_greeting(name: str = "") -> dict:
    """Fetches a greeting for the user.

    Args:
        name: Who to greet. Empty greets the current user.

    Returns:
        An object with a `greeting` string and a `facts` list of strings.
    """
    payload = _fixture("greeting")
    if name:
        return {**payload, "greeting": f"{payload['greeting']}, {name}"}
    return payload


STUB_TOOLS = [get_greeting]
