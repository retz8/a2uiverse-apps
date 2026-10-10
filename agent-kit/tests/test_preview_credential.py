"""The preview credential command (a2uiverse task-13.7 decisions 1 to 4): a token through the
non-interactive entry, alone on stdout, and the three refusals that print nothing there."""

from __future__ import annotations

import asyncio

import pytest

from a2ui_agent_kit import preview_credential as command
from a2ui_agent_kit.beats import AGENT_CARD_PATH
from a2ui_agent_kit.preview_credential import Refused, first_sign_in_scopes, preview_credential
from tests.conftest import make_config
from tests.test_sign_in import _config, _result, _sign_in, _Upstream, running

OAUTH_CARD = {
    "securitySchemes": {
        "signIn": {
            "type": "oauth2",
            "flows": {"authorizationCode": {"scopes": {"read": "Read", "write": "Write"}}},
        }
    },
    "security": [{"signIn": ["openid", "read"]}],
}


def test_the_scopes_are_the_cards_first_alternative():
    assert first_sign_in_scopes(OAUTH_CARD) == ["openid", "read"]


def test_a_card_on_a_key_is_refused_with_the_key_named_as_the_credential():
    card = {
        "securitySchemes": {"key": {"type": "apiKey", "in": "header", "name": "X-Shop-Key"}},
        "security": [{"key": []}],
    }
    with pytest.raises(Refused, match="signs in with a key; set STELLIFY_CREDENTIAL to the key"):
        first_sign_in_scopes(card)


@pytest.mark.parametrize("security", [None, [], [{}], [{"signIn": ["read"]}, {}]])
def test_a_card_asking_no_sign_in_is_refused(security):
    card = {**OAUTH_CARD, "security": security}
    with pytest.raises(Refused, match="needs no sign-in; preview it without a credential"):
        first_sign_in_scopes(card)


async def test_a_fake_account_signs_in_for_the_first_scopes_and_the_token_answers(tmp_path):
    async with running(tmp_path) as agent:
        token = await asyncio.to_thread(preview_credential, agent.base, "alan")
        answered = _result(await agent.send("list_issues", token))
    assert answered["status"]["state"] == "completed"


async def test_the_token_is_alone_on_stdout_and_the_cards_url_is_taken(tmp_path, capsys):
    async with running(tmp_path) as agent:
        url = f"{agent.base}{AGENT_CARD_PATH}"
        code = await asyncio.to_thread(command.main, ["--url", url, "--account", "ada"])
        out, err = capsys.readouterr()
        answered = _result(await agent.send("list_issues", out.strip()))
    assert code == 0
    assert len(out.splitlines()) == 1
    assert "signed in as ada" in err
    assert answered["status"]["state"] == "completed"


async def test_a_live_agent_refuses_and_the_words_point_to_a_deterministic_run(tmp_path, capsys):
    config = _config(tmp_path, _sign_in(upstream=_Upstream()))
    async with running(tmp_path, "live", config=config) as agent:
        code = await asyncio.to_thread(command.main, ["--url", agent.base, "--account", "ada"])
    out, err = capsys.readouterr()
    assert code == 1
    assert out == ""
    assert "not live mode" in err
    assert "deterministic or stub mode" in err


async def test_an_account_the_agent_lacks_is_refused_with_its_words(tmp_path, capsys):
    async with running(tmp_path) as agent:
        code = await asyncio.to_thread(command.main, ["--url", agent.base, "--account", "nobody"])
    out, err = capsys.readouterr()
    assert (code, out) == (1, "")
    assert "names no account" in err
    assert "README lists its fake accounts" in err


async def test_an_agent_without_sign_in_is_refused_from_its_card(tmp_path, capsys):
    async with running(tmp_path, config=make_config("basic", tmp_path)) as agent:
        code = await asyncio.to_thread(command.main, ["--url", agent.base, "--account", "ada"])
    out, err = capsys.readouterr()
    assert (code, out) == (1, "")
    assert "needs no sign-in" in err


def test_an_agent_that_does_not_answer_is_refused(capsys):
    assert command.main(["--url", "http://127.0.0.1:9", "--account", "ada"]) == 1
    out, err = capsys.readouterr()
    assert out == ""
    assert "did not answer" in err


def test_the_account_is_required_and_the_usage_names_the_readme(capsys):
    with pytest.raises(SystemExit) as exited:
        command.main(["--url", "http://localhost:11001"])
    assert exited.value.code == 2
    assert "listed in its README" in capsys.readouterr().err
