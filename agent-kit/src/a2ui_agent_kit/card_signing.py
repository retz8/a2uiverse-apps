"""Signing the card: a P-256 key the kit makes, ES256, the key set under the base URL.

An app turns signing on with `sign_card` on its config (a2uiverse task-20.9 decision 14). At
its first run the kit makes a P-256 key and keeps it in the app's state directory, in an
owner-only file of its own, apart from the sign-in server's ID-token key. Every card the agent
serves is signed with it under ES256, the public card and each account's own alike, by the
Python A2A SDK's own signer, and the key set naming its public half is served at
`/.well-known/jwks.json` under the base URL: the card URL's own origin, where a client looks
for it (a2uiverse task-20.7 decision 3).
"""

from __future__ import annotations

import json
import os
import secrets
from pathlib import Path

from a2a.types import AgentCard
from a2a.utils.signing import create_agent_card_signer
from joserfc.jwk import ECKey
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Route

KEY_FILE = "card-signing-key.json"
KEY_SET_PATH = "/.well-known/jwks.json"
ALGORITHM = "ES256"


class CardSigner:
    """The app's card-signing key, its signer and its key set."""

    def __init__(self, state_dir: Path, base_url: str):
        self._path = Path(state_dir) / KEY_FILE
        self._jwk = self._load() or self._make()
        self.kid: str = self._jwk["kid"]
        self.key_set_url = f"{base_url.rstrip('/')}{KEY_SET_PATH}"
        self._sign = create_agent_card_signer(
            ECKey.import_key(self._jwk).private_key,
            {"alg": ALGORITHM, "typ": "JOSE", "kid": self.kid, "jku": self.key_set_url},
        )

    def _load(self) -> dict | None:
        if not self._path.is_file():
            return None
        return json.loads(self._path.read_text(encoding="utf-8"))

    def _make(self) -> dict:
        jwk = ECKey.generate_key("P-256", private=True).as_dict(private=True)
        jwk["kid"] = secrets.token_urlsafe(8)
        self._path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        tmp = self._path.with_name(f".{KEY_FILE}.{os.getpid()}.tmp")
        fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(jwk, fh, indent=1, sort_keys=True)
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(tmp, self._path)
        return jwk

    def sign(self, card: AgentCard) -> AgentCard:
        """A signed copy of `card`, `card` left as it was."""
        signed = AgentCard()
        signed.CopyFrom(card)
        return self._sign(signed)

    def key_set(self) -> dict:
        public = ECKey.import_key(self._jwk).as_dict(private=False)
        public.update(kid=self.kid, alg=ALGORITHM, use="sig")
        return {"keys": [public]}

    def routes(self) -> list[Route]:
        async def serve_key_set(_request: Request) -> JSONResponse:
            return JSONResponse(self.key_set())

        return [Route(KEY_SET_PATH, serve_key_set, methods=["GET"])]
