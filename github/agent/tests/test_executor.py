from tests.helpers import run_executor

SUBMIT = {"name": "submit", "surfaceId": "button-event", "sourceComponentId": "root", "context": {}}


async def test_submit_emits_data_model_then_components_echoing_surface():
    payload = await run_executor(SUBMIT)
    assert [next(k for k in m if k != "version") for m in payload] == [
        "updateDataModel",
        "updateComponents",
    ]
    assert payload[0]["updateDataModel"] == {
        "surfaceId": "button-event",
        "path": "/submitted",
        "value": True,
    }
    assert payload[1]["updateComponents"]["surfaceId"] == "button-event"
    assert payload[1]["updateComponents"]["components"] == [
        {"id": "label", "component": "Text", "text": "✅ Sent — server received submit"}
    ]


async def test_unknown_event_emits_single_text_fallback():
    payload = await run_executor({"name": "nope", "surfaceId": "s2", "context": {}})
    assert len(payload) == 1
    assert payload[0]["updateComponents"]["components"][0]["text"] == "Unhandled event: nope"
