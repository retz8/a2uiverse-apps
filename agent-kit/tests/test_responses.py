"""The fixture-responder machinery: stamping, fallback, fresh text-surface ids."""

from pathlib import Path

import pytest

from a2uiverse_kit.responses import fallback, fixture_responder, load_fixture, stamp_surface

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "deterministic"


def _pair():
    return fixture_responder(
        FIXTURES,
        {"greet": "greeting.json"},
        text_fixture="digest.json",
        surface_prefix="test",
    )


def test_known_action_plays_its_fixture_stamped_with_the_action_surface():
    build_response, _ = _pair()
    messages = build_response({"name": "greet", "surfaceId": "s-42"})
    assert messages[0]["updateComponents"]["surfaceId"] == "s-42"
    assert messages[0]["updateComponents"]["components"][0]["text"] == "ok"


def test_unknown_action_gets_the_visible_fallback():
    build_response, _ = _pair()
    messages = build_response({"name": "nope", "surfaceId": "s-1"})
    assert messages[0]["updateComponents"]["surfaceId"] == "s-1"
    assert "Unhandled event: nope" in messages[0]["updateComponents"]["components"][0]["text"]


def test_text_prompts_mint_fresh_prefixed_surfaces():
    _, build_text_response = _pair()
    first = build_text_response("anything")
    second = build_text_response("anything else")
    assert first[0]["createSurface"]["surfaceId"] == "test-1"
    assert second[0]["createSurface"]["surfaceId"] == "test-2"
    # every operation in the fixture is stamped
    assert first[1]["updateComponents"]["surfaceId"] == "test-1"


def test_missing_fixture_raises_a_named_error():
    with pytest.raises(FileNotFoundError, match="missing"):
        load_fixture(FIXTURES, "does-not-exist.json")


def test_stamp_surface_touches_only_operation_keys():
    messages = [{"version": "v0.9", "somethingElse": {"surfaceId": "keep"}}]
    stamp_surface(messages, "new")
    assert messages[0]["somethingElse"]["surfaceId"] == "keep"


def test_fallback_shape():
    messages = fallback("x", "s")
    assert messages[0]["version"] == "v0.9"
    assert messages[0]["updateComponents"]["surfaceId"] == "s"
