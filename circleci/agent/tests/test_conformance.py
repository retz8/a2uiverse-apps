"""Every canned response the deterministic executor emits conforms to the app's catalog."""

import pytest

from a2ui_agent_kit.catalog import catalog_context

from app.config import CONFIG
from app.responses import EVENT_FIXTURES
from tests.helpers import run_executor, run_executor_text

validate_payload = catalog_context(CONFIG).validate_payload


@pytest.mark.parametrize("event", sorted(EVENT_FIXTURES))
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
    payload = await run_executor_text("Say hello")
    validate_payload(payload)  # must not raise
