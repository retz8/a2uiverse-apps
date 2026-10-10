"""The preview credential: a token from the publisher's own running agent (a2uiverse task-13.7).

Stellify's `preview` sends the credential it finds in `STELLIFY_CREDENTIAL`. For an app on the
kit's sign-in that is an access token the agent issues. This command signs in at the running
agent as one of its fake accounts, through the non-interactive entry, for the scopes the card's
first `security` alternative asks — what the vault asks at a first sign-in — and prints the
token alone on stdout, every message on stderr, for the shell to capture:

    STELLIFY_CREDENTIAL=$(uv run python -m a2ui_agent_kit.preview_credential \\
        --url http://localhost:11001 --account retz8) stellify preview …

The fake accounts sign in only in deterministic and stub mode. A live agent refuses the entry,
and a live app's preview is captured from a deterministic or stub run of the same checkout: one
card serves every mode, so the preview's version is the live card's. An app on a key, or asking
no sign-in, needs no token from here. Every refusal prints nothing on stdout and exits 1, so a
capture is empty rather than wrong.
"""

from __future__ import annotations

import argparse
import sys
from urllib.parse import parse_qs, urlsplit

import httpx

from a2ui_agent_kit.beats import AGENT_CARD_PATH, SignInFailed, sign_in
from a2ui_agent_kit.sign_in_server import FAKE_ACCOUNT_LIVE_REFUSAL

TIMEOUT_S = 10.0


class Refused(Exception):
    """No token: the line printed on stderr, saying what to do instead."""


def first_sign_in_scopes(card: dict) -> list[str]:
    """The scopes the card's first `security` alternative asks of its OAuth scheme. A card on a
    key, or one asking no sign-in — no alternative, or an empty one (SPEC §8) — is refused."""
    security = card.get("security") or []
    if not security or not all(security):
        raise Refused("this app needs no sign-in; preview it without a credential")
    key, scopes = next(iter(security[0].items()))
    scheme = (card.get("securitySchemes") or {}).get(key) or {}
    if scheme.get("type") == "apiKey":
        raise Refused("this app signs in with a key; set STELLIFY_CREDENTIAL to the key")
    if scheme.get("type") != "oauth2":
        raise Refused(f"the card's sign-in '{key}' is not the agent kit's: bring your own credential")
    return list(scopes)


def agent_base(url: str) -> str:
    """The agent's address, from its own or its card's URL."""
    url = url.rstrip("/")
    return url.removesuffix(AGENT_CARD_PATH) if url.endswith(AGENT_CARD_PATH) else url


def _agent_words(location: str) -> str:
    """The agent's own words for a refused sign-in: the OAuth error's description on the return,
    else whatever it answered."""
    query = parse_qs(urlsplit(location).query)
    described = query.get("error_description") or query.get("error")
    return described[0] if described else location or "no answer"


def preview_credential(url: str, account: str) -> str:
    """The access token the agent at `url` issues to `account`, or `Refused`."""
    base = agent_base(url)
    try:
        with httpx.Client(base_url=base, timeout=TIMEOUT_S) as client:
            card = client.get(AGENT_CARD_PATH)
            card.raise_for_status()
            scopes = first_sign_in_scopes(card.json())
            return sign_in(client, account, scopes)
    except SignInFailed as failed:
        words = _agent_words(failed.location)
        if words == FAKE_ACCOUNT_LIVE_REFUSAL:
            raise Refused(
                f"{words} Run this app in deterministic or stub mode to take its preview."
            ) from None
        raise Refused(f"{words} The agent's README lists its fake accounts.") from None
    except httpx.HTTPError as error:
        raise Refused(f"the agent at {base} did not answer: {error}") from None


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="python -m a2ui_agent_kit.preview_credential",
        description="Print a token for `stellify preview`, issued by your running agent to one "
        "of its fake accounts. Deterministic and stub mode only.",
    )
    parser.add_argument("--url", required=True, help="the running agent's address, or its card's")
    parser.add_argument("--account", help="one of the agent's fake accounts, listed in its README")
    args = parser.parse_args(argv)
    if not args.account:
        parser.error("--account is required: one of the agent's fake accounts, listed in its README")
    try:
        token = preview_credential(args.url, args.account)
    except Refused as refused:
        print(refused, file=sys.stderr)
        return 1
    print(f"signed in as {args.account}", file=sys.stderr)
    print(token)
    return 0


if __name__ == "__main__":
    sys.exit(main())
