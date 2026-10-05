"""Headless beat driver: runs an app's beats against its live agent and keeps the streams.

Task 8.1. The agent records what it streams (recorder.py, armed by A2UI_RECORD_DIR);
this driver supplies the prompts, threads the conversation, and finalizes each session
into a per-beat fixture under the app's `recordings/beats/`. The beats themselves —
prompts, titles, chaining — are the app's, carried by its `scripts/record_beats.py`
shim along with its agent URL and directories.

It talks A2A JSON-RPC over SSE directly rather than through a client SDK: the only
things it needs off the wire are the conversation id and the end of the stream, and the
recorder — not this driver — is what captures the content.

The agent must already be running. The model is an agent-startup concern (ADK builds the
LlmAgent once), so a beat that needs a different rung of the model ladder is driven in a
separate invocation against a separately-started agent.

An agent whose card asks sign-in is driven signed in. `--account` names one of its fake
accounts and signs in through the non-interactive entry (task-12.11 decision 7); without
it the driver opens the agent's own sign-in page in the browser and catches the return on
a loopback address (RFC 8252) — the vendor's sign-in in live mode, the account chooser
otherwise. An agent signing in with an API key is driven with `--api-key`. An app whose
fake accounts each have their own data records each into its own subdirectory.
"""

from __future__ import annotations

import argparse
import json
import time
import uuid
import webbrowser
from collections.abc import Callable
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlencode
from datetime import datetime, timezone
from pathlib import Path

import httpx
from authlib.common.security import generate_token
from authlib.integrations.httpx_client import OAuth2Client

from a2ui_agent_kit.sign_in import OPENID_SCOPE
from a2ui_agent_kit.sign_in_fake import message_page
from a2ui_agent_kit.sign_in_server import FAKE_ACCOUNT_PARAM, METADATA_PATH

# Beat 2 has taken up to 6.5 minutes on a slower rung (7.7 journal, R4); the ceiling is
# generous so a slow turn is never mistaken for a hung one.
TURN_TIMEOUT_S = 900.0
MAX_ATTEMPTS_PER_BEAT = 3

AGENT_CARD_PATH = "/.well-known/agent-card.json"
# The address the driver names as its own when it signs in as a fake account. Nothing
# listens there: the driver reads the code off the redirect without following it.
SIGN_IN_REDIRECT = "http://localhost:8765/callback"
# How long the driver waits for the person to finish signing in in the browser.
BROWSER_SIGN_IN_TIMEOUT_S = 600.0


class Turn:
    """One prompt to send. `chains` keeps the previous turn's conversation."""

    def __init__(self, beat: int, slug: str, title: str, prompt: str, chains: bool = False):
        self.beat = beat
        self.slug = slug
        self.title = title
        self.prompt = prompt
        self.chains = chains


def log(message: str) -> None:
    print(f"[record-beats] {message}", flush=True)


def card_scopes(card: dict) -> list[str] | None:
    """Every scope the card's `oauth2` scheme declares; None when the card asks no OAuth sign-in."""
    for scheme in (card.get("securitySchemes") or {}).values():
        flow = (scheme.get("flows") or {}).get("authorizationCode")
        if scheme.get("type") == "oauth2" and flow:
            return list(flow.get("scopes") or {})
    return None


def card_api_key_header(card: dict) -> str | None:
    """The header the card's `apiKey` scheme rides; None when the card asks no key."""
    for scheme in (card.get("securitySchemes") or {}).values():
        if scheme.get("type") == "apiKey" and scheme.get("in") == "header":
            return scheme.get("name")
    return None


def _sign_in(
    client: httpx.Client, scopes: list[str], redirect: str, browse: Callable[[str], str]
) -> str:
    """One sign-in at the agent, as a public client returning to `redirect`, asking for
    `scopes` — every scope of the app, so no beat stops on more access. `browse` takes the
    sign-in address and comes back with where the agent sent the browser. The access token."""
    metadata = client.get(METADATA_PATH).json()
    registration = {
        "redirect_uris": [redirect],
        "token_endpoint_auth_method": "none",
        "grant_types": ["authorization_code"],
        "response_types": ["code"],
    }
    client_id = client.post(metadata["registration_endpoint"], json=registration).json()["client_id"]
    verifier = generate_token(48)
    with OAuth2Client(
        client_id=client_id,
        redirect_uri=redirect,
        scope=" ".join([OPENID_SCOPE, *scopes]),
        code_challenge_method="S256",
        token_endpoint_auth_method="none",
    ) as oauth:
        url, state = oauth.create_authorization_url(
            metadata["authorization_endpoint"], code_verifier=verifier
        )
        location = browse(url)
        if not location.startswith(redirect) or "code=" not in location:
            raise SystemExit(f"signing in failed: {location or 'no answer'}")
        token = oauth.fetch_token(
            metadata["token_endpoint"],
            authorization_response=location,
            code_verifier=verifier,
            state=state,
        )
    return str(token["access_token"])


def sign_in(client: httpx.Client, account: str, scopes: list[str]) -> str:
    """Signs in as the fake account `account` through the non-interactive entry."""

    def browse(url: str) -> str:
        response = client.get(f"{url}&{urlencode({FAKE_ACCOUNT_PARAM: account})}")
        return response.headers.get("location", "") or response.text

    return _sign_in(client, scopes, SIGN_IN_REDIRECT, browse)


class _Return(BaseHTTPRequestHandler):
    """The loopback address the browser comes back to at the end of the sign-in."""

    def do_GET(self) -> None:  # noqa: N802 - the stdlib's name
        if self.path.startswith("/callback"):
            self.server.location = f"http://127.0.0.1:{self.server.server_port}{self.path}"
            body = message_page("You're signed in", "You can close this window.").body
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
        else:
            body = b""
            self.send_response(404)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args) -> None:
        pass


def sign_in_in_browser(
    client: httpx.Client,
    scopes: list[str],
    *,
    open_browser: Callable[[str], object] = webbrowser.open,
    timeout: float = BROWSER_SIGN_IN_TIMEOUT_S,
) -> str:
    """Signs in through the agent's own sign-in page in the browser, the return caught on a
    loopback address (RFC 8252): the vendor's sign-in in live mode, the chooser otherwise."""
    with HTTPServer(("127.0.0.1", 0), _Return) as returned:
        returned.location = ""
        redirect = f"http://127.0.0.1:{returned.server_port}/callback"

        def browse(url: str) -> str:
            log(f"sign in in your browser; if no window opened, open {url}")
            open_browser(url)
            deadline = time.monotonic() + timeout
            while not returned.location and (left := deadline - time.monotonic()) > 0:
                returned.timeout = left
                returned.handle_request()
            return returned.location

        return _sign_in(client, scopes, redirect, browse)


def send_turn(client: httpx.Client, text: str, context_id: str | None) -> tuple[str | None, int]:
    """POSTs one prompt and drains the SSE stream. Returns (contextId, event count)."""
    message: dict = {
        "kind": "message",
        "role": "user",
        "messageId": uuid.uuid4().hex,
        "parts": [{"kind": "text", "text": text}],
    }
    if context_id:
        message["contextId"] = context_id
    body = {
        "jsonrpc": "2.0",
        "id": uuid.uuid4().hex,
        "method": "message/stream",
        "params": {"message": message},
    }

    seen_context = context_id
    events = 0
    with client.stream("POST", "/", json=body, timeout=TURN_TIMEOUT_S) as response:
        response.raise_for_status()
        for line in response.iter_lines():
            if not line.startswith("data:"):
                continue
            events += 1
            try:
                payload = json.loads(line[len("data:") :].strip())
            except json.JSONDecodeError:
                continue
            result = payload.get("result")
            if isinstance(result, dict) and result.get("contextId"):
                seen_context = result["contextId"]
    return seen_context, events


def read_session(record_dir: Path, context_id: str) -> dict | None:
    safe = "".join(c if c.isalnum() or c in "._-" else "-" for c in context_id)
    path = record_dir / f"session-{safe}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def _messages(turn: dict) -> list[dict]:
    return [msg for batch in turn.get("batches", []) for msg in batch.get("messages", [])]


def turn_is_good(turn: dict) -> tuple[bool, str]:
    """A usable fixture completed and delivered A2UI the client can act on."""
    if turn.get("outcome") != "completed":
        return False, f"outcome={turn.get('outcome')}"
    if not _messages(turn):
        return False, "no A2UI reached the client"
    return True, "ok"


def group_is_good(turns: list[dict]) -> tuple[bool, str]:
    """A recorded group must, between its turns, have painted a surface.

    Per turn the requirement is only that A2UI arrived: a turn that updates an
    existing surface and creates none is an ordinary paint the protocol allows and
    the prompt prose explicitly invites, and it is the shape both mock instruments
    take (task-4.6 decision 15). Requiring a `createSurface` of the *group* keeps
    what the rule was actually protecting — a recording nothing can render — while
    letting an update-only turn be recorded.
    """
    for index, turn in enumerate(turns):
        ok, why = turn_is_good(turn)
        if not ok:
            return False, f"turn {index + 1}: {why}"
    created = any("createSurface" in msg for turn in turns for msg in _messages(turn))
    if not created:
        return False, "no createSurface reached the client in any turn"
    return True, "ok"


def write_fixture(
    fixture_dir: Path, spec: Turn, session: dict, turn: dict, model: str, chained_from: str | None
) -> Path:
    fixture_dir.mkdir(parents=True, exist_ok=True)
    name = f"beat-{spec.beat}-{spec.slug}"
    fixture = {
        "name": name,
        "beat": spec.beat,
        "title": spec.title,
        "prompt": spec.prompt,
        "model": model,
        "recordedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "contextId": session.get("contextId"),
        "chainedFrom": chained_from,
        "turns": [turn],
    }
    path = fixture_dir / f"{name}.json"
    path.write_text(json.dumps(fixture, indent=2) + "\n", encoding="utf-8")
    return path


def drive(
    specs: list[Turn],
    model: str,
    record_dir: Path,
    url: str,
    fixture_dir: Path,
    account: str | None = None,
    api_key: str | None = None,
) -> int:
    results: list[tuple[Turn, bool, str]] = []
    client = httpx.Client(base_url=url)
    card = client.get(AGENT_CARD_PATH).json()
    if (scopes := card_scopes(card)) is not None:
        token = sign_in(client, account, scopes) if account else sign_in_in_browser(client, scopes)
        client.headers["Authorization"] = f"Bearer {token}"
        log(f"signed in{f' as {account}' if account else ''}")
    elif (header := card_api_key_header(card)) is not None:
        if not api_key:
            log("the agent signs in with a key: pass it with --api-key")
            return 2
        client.headers[header] = api_key
    index = 0
    while index < len(specs):
        spec = specs[index]
        # A chained beat is driven together with the one it follows, in one conversation.
        group = [spec]
        while index + 1 < len(specs) and specs[index + 1].chains:
            index += 1
            group.append(specs[index])
        index += 1

        for attempt in range(1, MAX_ATTEMPTS_PER_BEAT + 1):
            label = "+".join(str(t.beat) for t in group)
            log(f"beat {label}: attempt {attempt}/{MAX_ATTEMPTS_PER_BEAT}")
            context_id: str | None = None
            failure: str | None = None
            started = time.monotonic()
            try:
                for spec_in_group in group:
                    log(f"  -> beat {spec_in_group.beat}: {spec_in_group.prompt!r}")
                    context_id, events = send_turn(client, spec_in_group.prompt, context_id)
                    log(f"     stream closed after {events} events ({time.monotonic()-started:.0f}s)")
            except Exception as err:  # wire/timeout failure: retry the whole group
                failure = f"{type(err).__name__}: {err}"
                log(f"  !! {failure}")

            session = read_session(record_dir, context_id) if context_id else None
            if failure is None and session is not None:
                recorded = session["turns"][-len(group) :]
                group_ok, group_why = group_is_good(recorded)
                if group_ok:
                    chained_from = None
                    for spec_in_group, turn in zip(group, recorded):
                        path = write_fixture(
                            fixture_dir, spec_in_group, session, turn, model, chained_from
                        )
                        chained_from = f"beat-{spec_in_group.beat}-{spec_in_group.slug}"
                        log(f"  ok  {path}")
                        results.append((spec_in_group, True, "ok"))
                    break
                failure = f"beat {'+'.join(str(t.beat) for t in group)}: {group_why}"
                log(f"  !! {failure}")

            if attempt == MAX_ATTEMPTS_PER_BEAT:
                # Record best-available and flag, rather than stalling the run.
                if session is not None:
                    chained_from = None
                    for spec_in_group, turn in zip(group, session["turns"][-len(group) :]):
                        path = write_fixture(
                            fixture_dir, spec_in_group, session, turn, model, chained_from
                        )
                        chained_from = f"beat-{spec_in_group.beat}-{spec_in_group.slug}"
                        log(f"  FLAGGED (best available) {path}")
                        results.append((spec_in_group, False, failure or "unknown"))
                else:
                    for spec_in_group in group:
                        results.append((spec_in_group, False, failure or "nothing recorded"))

    log("")
    log("=== summary ===")
    failures = 0
    for spec, ok, why in sorted(results, key=lambda r: r[0].beat):
        log(f"beat {spec.beat} {spec.slug}: {'ok' if ok else 'FLAGGED — ' + why}")
        failures += 0 if ok else 1
    return 1 if failures else 0


def main(
    beats: list[Turn],
    agent_url: str,
    *,
    record_dir: Path,
    fixture_dir: Path,
    per_account: bool = False,
    argv: list[str] | None = None,
) -> int:
    """`per_account`: the app's fake accounts each have their own data, so the beats are
    recorded into `<fixture_dir>/<account>/`."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--beats",
        default=",".join(str(b.beat) for b in beats),
        help="comma-separated beat numbers",
    )
    parser.add_argument("--model", required=True, help="model the agent was started with (recorded)")
    parser.add_argument("--record-dir", default=str(record_dir))
    parser.add_argument("--url", default=agent_url, help="agent base URL")
    parser.add_argument(
        "--account",
        required=per_account,
        help="a fake account to sign in as; without it, sign in in the browser",
    )
    parser.add_argument("--api-key", help="the key, for an agent signing in with one")
    args = parser.parse_args(argv)
    if per_account:
        fixture_dir = fixture_dir / args.account

    wanted = {int(n) for n in args.beats.split(",") if n.strip()}
    # A chained beat cannot be driven without the beat it follows.
    for spec in beats:
        if spec.chains and spec.beat in wanted:
            wanted.add(spec.beat - 1)
    specs = [b for b in beats if b.beat in wanted]

    log(f"agent {args.url} · model {args.model} · beats {[s.beat for s in specs]}")
    return drive(
        specs, args.model, Path(args.record_dir), args.url, fixture_dir, args.account, args.api_key
    )
