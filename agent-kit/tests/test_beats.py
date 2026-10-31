"""The beat driver's usability gate.

A recording is usable when every turn completed and delivered A2UI, and the group as a
whole painted a surface. The `createSurface` requirement sits on the group rather than
on each turn (task-4.6 decision 15): a turn that only updates an existing surface is an
ordinary paint the protocol allows and the prompt prose invites, and it is the shape an
in-fragment instrument takes.
"""

from __future__ import annotations

import asyncio
import threading
from types import SimpleNamespace

import httpx

from a2ui_agent_kit import beats
from a2ui_agent_kit.beats import (
    AGENT_CARD_PATH,
    card_api_key_header,
    card_scopes,
    group_is_good,
    sign_in,
    sign_in_in_browser,
    turn_is_good,
)
from tests.test_sign_in import _Form, running


def turn(outcome: str = "completed", *, messages: list[dict] | None = None) -> dict:
    return {"outcome": outcome, "batches": [{"messages": messages or []}]}


CREATE = {"createSurface": {"surfaceId": "list"}}
UPDATE = {"updateDataModel": {"surfaceId": "list", "path": "/items", "value": []}}


def test_a_turn_is_good_when_it_completed_and_delivered_a2ui():
    assert turn_is_good(turn(messages=[CREATE])) == (True, "ok")
    assert turn_is_good(turn(messages=[UPDATE])) == (True, "ok")


def test_a_turn_that_did_not_complete_or_delivered_nothing_is_not_good():
    ok, why = turn_is_good(turn("apology", messages=[CREATE]))
    assert not ok and "apology" in why
    ok, why = turn_is_good(turn(messages=[]))
    assert not ok and "no A2UI" in why


def test_an_update_only_turn_is_recordable_when_its_group_painted():
    """The instruments' shape: a list paint, then turns that only mutate it."""
    ok, _ = group_is_good([turn(messages=[CREATE]), turn(messages=[UPDATE])])
    assert ok


def test_a_group_that_never_painted_is_not_recordable():
    ok, why = group_is_good([turn(messages=[UPDATE])])
    assert not ok and "createSurface" in why


def test_a_group_names_the_turn_that_failed():
    ok, why = group_is_good([turn(messages=[CREATE]), turn("apology", messages=[UPDATE])])
    assert not ok and "turn 2" in why


# ---- signing in (task-12.11 decision 7) --------------------------------------------------


def test_the_card_names_the_scopes_to_ask_or_no_sign_in():
    card = {
        "securitySchemes": {
            "signIn": {
                "type": "oauth2",
                "flows": {"authorizationCode": {"scopes": {"read": "Read", "write": "Write"}}},
            }
        }
    }
    assert card_scopes(card) == ["read", "write"]
    assert card_scopes({"name": "open"}) is None


async def test_the_driver_signs_in_as_the_named_fake_account_with_every_scope(tmp_path):
    async with running(tmp_path) as agent:
        def signed_in() -> str:
            with httpx.Client(base_url=agent.base) as client:
                return sign_in(client, "alan", card_scopes(client.get(AGENT_CARD_PATH).json()))

        token = await asyncio.to_thread(signed_in)
        answered = await agent.send("close_issue", token)
    # close_issue needs issues.write, beyond the first sign-in: granted up front, no escalation.
    assert answered.json()["result"]["status"]["state"] == "completed"


async def test_without_an_account_the_driver_signs_in_in_the_browser(tmp_path):
    # The person's browser, played by a thread: the agent's own sign-in page, an account
    # chosen, and the return caught on the driver's loopback address (RFC 8252).
    opened: list[str] = []

    def browser(url: str) -> None:
        def person():
            with httpx.Client() as http:
                page = http.get(url)
                form = _Form.read(page.text)
                chosen = http.post(form.action, data={"pending": form.pending, "account": "ada"})
                landed = http.get(chosen.headers["location"])
                opened.append(landed.text)

        opened.append(url)
        threading.Thread(target=person, daemon=True).start()

    async with running(tmp_path) as agent:
        def signed_in() -> str:
            with httpx.Client(base_url=agent.base) as client:
                scopes = card_scopes(client.get(AGENT_CARD_PATH).json())
                return sign_in_in_browser(client, scopes, open_browser=browser, timeout=10)

        token = await asyncio.to_thread(signed_in)
        answered = await agent.send("close_issue", token)
    assert answered.json()["result"]["status"]["state"] == "completed"
    assert opened[0].startswith(f"{agent.base}/oauth/authorize")
    assert "close this window" in opened[1]


def test_an_api_key_card_names_the_header_its_key_rides():
    card = {"securitySchemes": {"apiKey": {"type": "apiKey", "in": "header", "name": "X-Shop-Key"}}}
    assert card_api_key_header(card) == "X-Shop-Key"
    assert card_scopes(card) is None
    assert card_api_key_header({"name": "open"}) is None


def test_an_api_key_agent_is_not_driven_without_its_key(monkeypatch, tmp_path):
    card = {"securitySchemes": {"apiKey": {"type": "apiKey", "in": "header", "name": "X-Shop-Key"}}}

    class Client:
        def __init__(self, **_):
            pass

        def get(self, path):
            return SimpleNamespace(json=lambda: card)

    monkeypatch.setattr(beats.httpx, "Client", Client)
    assert beats.drive([], "m", tmp_path, "http://agent", tmp_path) == 2


# ---- the measurement in the fixture (a2uiverse task-17.3) -----------------------------------


def _measured_turn(model="gemini-3.8-flash", effort="low", requests=None) -> dict:
    return {
        "taskId": "t",
        "kind": "utterance",
        "prompt": "p",
        "action": None,
        "model": model,
        "effort": effort,
        "batches": [{"offsetMs": 1900, "messages": [CREATE], "texts": []}],
        "outcome": "completed",
        "durationMs": 9900,
        "requests": requests
        if requests is not None
        else [
            {
                "attempt": 1, "index": 1, "startMs": 0, "firstTokenMs": 1200, "endMs": 1300,
                "timeToFirstTokenMs": 1200, "generationMs": 100, "ended": "toolCall",
                "tools": ["list_issues"], "usage": {"promptTokens": 7000, "outputTokens": 40},
            },
            {
                "attempt": 1, "index": 2, "startMs": 2000, "firstTokenMs": 3800, "endMs": 9800,
                "timeToFirstTokenMs": 1800, "generationMs": 6000, "ended": "text",
                "usage": {"promptTokens": 7200, "outputTokens": 650, "thoughtsTokens": 0},
            },
        ],
    }


def test_the_fixture_keeps_the_agents_word_on_the_model_and_the_effort(tmp_path):
    """The agent stamped the turn; the driver's --model is the operator's claim (decision 5)."""
    import json

    spec = beats.Turn(1, "my-issues", "My issues", "p")
    turn = _measured_turn(model="anthropic/claude-haiku-5-5", effort="low")
    path = beats.write_fixture(tmp_path, spec, {"contextId": "c"}, turn, "gemini-3.8-flash", None)
    fixture = json.loads(path.read_text(encoding="utf-8"))
    assert fixture["model"] == "anthropic/claude-haiku-5-5"
    assert fixture["effort"] == "low"
    assert fixture["turns"][0]["requests"] == turn["requests"]


def test_a_turn_without_a_stamp_takes_the_drivers_model(tmp_path):
    """The beats recorded before the stamp existed are written as they always were."""
    import json

    spec = beats.Turn(1, "my-issues", "My issues", "p")
    turn = {"taskId": "t", "batches": [{"messages": [CREATE]}], "outcome": "completed"}
    path = beats.write_fixture(tmp_path, spec, {"contextId": "c"}, turn, "gemini-3.8-flash", None)
    fixture = json.loads(path.read_text(encoding="utf-8"))
    assert fixture["model"] == "gemini-3.8-flash"
    assert "effort" not in fixture


def test_the_driver_says_when_the_agent_ran_another_model_than_it_was_told():
    disagreement = beats.model_disagreement([_measured_turn(model="gemini-3.8-flash")], "gemini-x")
    assert disagreement is not None
    assert "gemini-x" in disagreement and "gemini-3.8-flash" in disagreement
    assert beats.model_disagreement([_measured_turn(model="gemini-x")], "gemini-x") is None
    assert beats.model_disagreement([{"outcome": "completed"}], "gemini-x") is None


def test_the_per_beat_line_carries_the_turns_totals():
    """The requests made, the painting request's first token and generation, the tokens in
    all (decision 7)."""
    line = beats.request_totals(_measured_turn())
    assert "2 requests" in line
    assert "first token 1.8 s" in line
    assert "generation 6.0 s" in line
    assert "14200 prompt" in line and "690 output" in line


def test_the_per_beat_line_is_nothing_for_a_turn_without_requests():
    assert beats.request_totals({"outcome": "completed", "batches": []}) is None


def test_the_painting_request_is_the_last_that_ended_in_text():
    """A retry's generation is the one that painted; a turn that only called tools has none
    and is read by its last request."""
    requests = [
        {"attempt": 1, "index": 1, "timeToFirstTokenMs": 500, "generationMs": 4000, "ended": "text"},
        {"attempt": 2, "index": 1, "timeToFirstTokenMs": 900, "generationMs": 3000, "ended": "text"},
    ]
    line = beats.request_totals(_measured_turn(requests=requests))
    assert "first token 0.9 s" in line and "generation 3.0 s" in line
    only_tools = [{"attempt": 1, "index": 1, "timeToFirstTokenMs": 700, "ended": "toolCall"}]
    line = beats.request_totals(_measured_turn(requests=only_tools))
    assert "first token 0.7 s" in line


# ---- a trial run (a2uiverse task-17.8) -------------------------------------------------------


def _open_agent(monkeypatch, sent: list[str]) -> None:
    """An agent that asks no sign-in, every turn sent counted."""

    class Client:
        def __init__(self, **_):
            self.headers = {}

        def get(self, path):
            return SimpleNamespace(json=lambda: {"name": "open"})

    def send_turn(client, text, context_id):
        sent.append(text)
        return "c", 1

    monkeypatch.setattr(beats.httpx, "Client", Client)
    monkeypatch.setattr(beats, "send_turn", send_turn)


def test_one_attempt_sends_a_failing_beat_once_and_flags_it(monkeypatch, tmp_path):
    """Counted as it falls (decision 3): no second try, the failure kept in the copy."""
    import json

    sent: list[str] = []
    _open_agent(monkeypatch, sent)
    session = {"contextId": "c", "turns": [turn("failed")]}
    monkeypatch.setattr(beats, "read_session", lambda record_dir, context_id: session)
    spec = beats.Turn(8, "notifications", "Notifications", "p")
    assert beats.drive([spec], "m", tmp_path, "http://agent", tmp_path, attempts=1) == 1
    assert sent == ["p"]
    fixture = json.loads((tmp_path / "beat-8-notifications.json").read_text(encoding="utf-8"))
    assert fixture["turns"][0]["outcome"] == "failed"


def test_a_failing_beat_is_tried_three_times_by_default(monkeypatch, tmp_path):
    sent: list[str] = []
    _open_agent(monkeypatch, sent)
    session = {"contextId": "c", "turns": [turn("failed")]}
    monkeypatch.setattr(beats, "read_session", lambda record_dir, context_id: session)
    spec = beats.Turn(8, "notifications", "Notifications", "p")
    assert beats.drive([spec], "m", tmp_path, "http://agent", tmp_path) == 1
    assert sent == ["p"] * beats.MAX_ATTEMPTS_PER_BEAT


def test_a_trial_run_writes_its_copies_where_it_is_told(monkeypatch, tmp_path):
    """The committed recordings stay as they are (decision 4)."""
    driven: dict = {}

    def drive(*args, **kwargs):
        driven.update(args=args, kwargs=kwargs)
        return 0

    monkeypatch.setattr(beats, "drive", drive)
    committed, elsewhere = tmp_path / "recordings" / "beats", tmp_path / "trial"
    spec = beats.Turn(8, "notifications", "Notifications", "p")
    argv = ["--model", "m", "--fixture-dir", str(elsewhere), "--attempts", "1"]
    beats.main([spec], "http://agent", record_dir=tmp_path, fixture_dir=committed, argv=argv)
    assert driven["args"][4] == elsewhere
    assert driven["kwargs"]["attempts"] == 1
    argv = ["--model", "m"]
    beats.main([spec], "http://agent", record_dir=tmp_path, fixture_dir=committed, argv=argv)
    assert driven["args"][4] == committed
    assert driven["kwargs"]["attempts"] == beats.MAX_ATTEMPTS_PER_BEAT
