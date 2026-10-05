"""The fixture-responder machinery: stamping, fallback, fresh text-surface ids."""

from pathlib import Path

import pytest

from a2ui_agent_kit.responses import (
    fallback,
    fixture_responder,
    load_fixture,
    stamp_surface,
    stub_fixture_loader,
)
from a2ui_agent_kit.sign_in import FakeAccount, SignIn
from a2ui_agent_kit.testing import signed_in_as

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "deterministic"
PER_ACCOUNT = Path(__file__).resolve().parent / "fixtures" / "per-account"

SIGN_IN = SignIn(
    scopes={"read": "See your things"},
    first_sign_in_scopes=["read"],
    fake_accounts=[
        FakeAccount("ada", {"email": "ada@example.com"}),
        FakeAccount("alan", {"email": "alan@example.com"}),
    ],
)


def _pair():
    return fixture_responder(
        FIXTURES,
        {"greet": "greeting.json", "open": "digest.json"},
        text_fixture="digest.json",
        surface_prefix="test",
    )


def test_known_action_plays_its_fixture_stamped_with_the_action_surface():
    build_response, _ = _pair()
    messages = build_response({"name": "greet", "surfaceId": "s-42"})
    assert messages[0]["updateComponents"]["surfaceId"] == "s-42"
    assert messages[0]["updateComponents"]["components"][0]["text"] == "ok"


def test_an_action_whose_fixture_creates_a_surface_answers_on_a_fresh_one():
    build_response, build_text_response = _pair()
    build_text_response("anything")
    messages = build_response({"name": "open", "surfaceId": "test-1"})
    # A new screen, as the live agent paints a drill-down: never the acted surface re-created.
    assert messages[0]["createSurface"]["surfaceId"] == "test-2"
    assert messages[1]["updateComponents"]["surfaceId"] == "test-2"


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


def test_stamp_surface_names_the_surface_in_a_paint_meta():
    # task-10.9 decision 8: the title and the question kind land on the surface stamped.
    messages = [{"paintMeta": {"surfaceId": "recorded", "title": "Run", "kind": "question"}}]
    stamp_surface(messages, "circleci-3")
    assert messages[0]["paintMeta"] == {
        "surfaceId": "circleci-3",
        "title": "Run",
        "kind": "question",
    }


def test_fallback_shape():
    messages = fallback("x", "s")
    assert messages[0]["version"] == "v0.9"
    assert messages[0]["updateComponents"]["surfaceId"] == "s"


def test_stub_loader_reads_and_caches_named_fixtures(tmp_path):
    (tmp_path / "list-things.json").write_text('{"things": [1]}', encoding="utf-8")
    fixture = stub_fixture_loader(tmp_path, hint="see agent/README.md.")
    assert fixture("list-things") == {"things": [1]}
    # cached: a rewrite is not re-read within one process
    (tmp_path / "list-things.json").write_text('{"things": []}', encoding="utf-8")
    assert fixture("list-things") == {"things": [1]}


def test_stub_loader_missing_fixture_fails_with_the_apps_hint(tmp_path):
    fixture = stub_fixture_loader(tmp_path, hint="see agent/README.md.")
    with pytest.raises(FileNotFoundError, match="README"):
        fixture("absent")


# ---- fixtures per account (task-12.11 decision 4) ----------------------------------------


def _greeting_text(messages: list[dict]) -> str:
    return messages[0]["updateComponents"]["components"][0]["text"]


def test_each_signed_in_account_gets_its_own_fixtures():
    build_response, build_text_response = fixture_responder(
        PER_ACCOUNT, {"greet": "greeting.json"}, text_fixture="greeting.json", surface_prefix="t"
    )
    with signed_in_as(SIGN_IN, "ada"):
        assert _greeting_text(build_text_response("hi")) == "ada"
    with signed_in_as(SIGN_IN, "alan"):
        assert _greeting_text(build_text_response("hi")) == "alan"
        assert _greeting_text(build_response({"name": "greet", "surfaceId": "s"})) == "alan"


def test_an_app_with_one_flat_set_answers_every_account_from_it():
    build_response, _ = _pair()
    with signed_in_as(SIGN_IN, "ada"):
        assert _greeting_text(build_response({"name": "greet", "surfaceId": "s"})) == "ok"


def test_an_account_with_no_fixtures_of_its_own_finds_none_in_a_per_account_set():
    _, build_text_response = fixture_responder(
        PER_ACCOUNT, {}, text_fixture="greeting.json", surface_prefix="t"
    )
    with pytest.raises(FileNotFoundError, match="missing"):
        build_text_response("hi")  # no account signed in: the flat set is empty


def test_the_stub_loader_reads_the_signed_in_accounts_corpus():
    fixture = stub_fixture_loader(PER_ACCOUNT, hint="see agent/README.md.")
    with signed_in_as(SIGN_IN, "ada"):
        assert fixture("list-things") == {"owner": "ada"}
    with signed_in_as(SIGN_IN, "alan"):
        assert fixture("list-things") == {"owner": "alan"}
