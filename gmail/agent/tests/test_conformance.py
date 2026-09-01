from pathlib import Path

import pytest

from a2uiverse_kit.catalog import catalog_context

from app.config import CONFIG
from app.responses import _EVENT_FIXTURES
from tests.helpers import run_executor

validate_payload = catalog_context(CONFIG).validate_payload


# The canned corpus is derived from a live recording run; these skip until one exists.
requires_corpus = pytest.mark.skipif(
    not (Path(__file__).resolve().parents[1] / "app" / "fixtures" / "deterministic").is_dir(),
    reason="deterministic corpus not recorded yet (see agent/README.md)",
)


@requires_corpus
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


@requires_corpus
async def test_emitted_text_prompt_payload_conforms_to_catalog():
    from tests.helpers import run_executor_text

    payload = await run_executor_text("hello agent")
    validate_payload(payload)  # must not raise
