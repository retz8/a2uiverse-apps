import pytest

from deterministic_agent.catalog import validate_payload
from deterministic_agent.responses import _EVENT_FIXTURES
from tests.helpers import run_executor


@pytest.mark.parametrize("event", sorted(_EVENT_FIXTURES))
async def test_emitted_event_payload_conforms_to_catalog(event):
    payload = await run_executor({"name": event, "surfaceId": "test", "context": {}})
    validate_payload(payload)  # must not raise


async def test_emitted_unknown_event_fallback_conforms_to_catalog():
    payload = await run_executor({"name": "nope", "surfaceId": "s2", "context": {}})
    validate_payload(payload)  # must not raise


def test_validator_rejects_non_conformant_component():
    bad = [
        {
            "version": "v0.9",
            "updateComponents": {
                "surfaceId": "s1",
                "components": [{"id": "x", "component": "NotARealComponent", "text": "y"}],
            },
        }
    ]
    with pytest.raises(ValueError):
        validate_payload(bad)


async def test_emitted_text_prompt_payload_conforms_to_catalog():
    from tests.helpers import run_executor_text

    payload = await run_executor_text("hello agent")
    validate_payload(payload)  # must not raise
