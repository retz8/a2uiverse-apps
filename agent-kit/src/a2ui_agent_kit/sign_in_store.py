"""The agent's sign-in store: one owner-only JSON file (task-12.9 decisions 1 and 15).

It holds what the agent's tokens stand for: the ID-token signing key, the clients
registered by dynamic registration, each account under the `sub` the agent minted for
it — its display claims and, in live mode, the vendor's token — and each sign-in (a
grant: an account, a client, the scopes granted) with its access and refresh tokens,
stored by hash. Written whole and atomically on every change; a sign-in in flight and
its authorization code live in memory only.

An account records whether it came from the fake sign-in or the vendor's, so a token
issued in one mode means nothing to an agent run in the other.
"""

from __future__ import annotations

import hashlib
import json
import os
import secrets
import time
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

from joserfc.jwk import ECKey

from a2ui_agent_kit.sign_in import SignedInAccount

STORE_FILE = "sign-in.json"

AccountKind = Literal["fake", "vendor"]


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


@dataclass(frozen=True)
class EndedSignIn:
    """An account whose last sign-in ended: its vendor token is gone from the store."""

    sub: str
    vendor_token: Mapping[str, Any] | None


class SignInStore:
    def __init__(self, state_dir: Path):
        self._dir = Path(state_dir)
        self._path = self._dir / STORE_FILE
        self._data = self._load()

    # ---- the file ----------------------------------------------------------------

    def _load(self) -> dict:
        if self._path.exists():
            return json.loads(self._path.read_text(encoding="utf-8"))
        data = {
            "version": 1,
            "signing_key": ECKey.generate_key("P-256", private=True).as_dict(private=True),
            "clients": {},
            "accounts": {},
            "grants": {},
            "access_tokens": {},
            "refresh_tokens": {},
        }
        data["signing_key"]["kid"] = secrets.token_urlsafe(8)
        self._data = data
        self._save()
        return data

    def _save(self) -> None:
        self._dir.mkdir(mode=0o700, parents=True, exist_ok=True)
        tmp = self._path.with_name(f".{STORE_FILE}.{os.getpid()}.tmp")
        fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(self._data, fh, indent=1, sort_keys=True)
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(tmp, self._path)

    @property
    def path(self) -> Path:
        return self._path

    # ---- the signing key ---------------------------------------------------------

    def signing_key(self) -> ECKey:
        return ECKey.import_key(self._data["signing_key"])

    def signing_kid(self) -> str:
        return self._data["signing_key"]["kid"]

    def public_jwks(self) -> dict:
        public = self.signing_key().as_dict(private=False)
        public.update(kid=self.signing_kid(), use="sig", alg="ES256")
        return {"keys": [public]}

    # ---- registered clients ------------------------------------------------------

    def save_client(self, client_id: str, metadata: dict) -> None:
        self._data["clients"][client_id] = metadata
        self._save()

    def registered_client(self, client_id: str) -> dict | None:
        return self._data["clients"].get(client_id)

    # ---- accounts ----------------------------------------------------------------

    def upsert_account(
        self,
        kind: AccountKind,
        account_id: str,
        claims: Mapping[str, str],
        vendor_token: Mapping[str, Any] | None,
    ) -> str:
        """The account's `sub`, minted the first time this account signs in."""
        accounts = self._data["accounts"]
        sub = next(
            (
                s
                for s, a in accounts.items()
                if a["kind"] == kind and a["account_id"] == account_id
            ),
            None,
        )
        if sub is None:
            sub = secrets.token_urlsafe(16)
        accounts[sub] = {
            "kind": kind,
            "account_id": account_id,
            "claims": dict(claims),
            "vendor_token": dict(vendor_token) if vendor_token is not None else None,
        }
        self._save()
        return sub

    def account(self, sub: str) -> dict | None:
        return self._data["accounts"].get(sub)

    # ---- sign-ins (grants) ---------------------------------------------------------

    def granted_scopes(self, sub: str, client_id: str) -> set[str]:
        """Every scope the account's live sign-ins to this client hold."""
        return {
            s
            for g in self._data["grants"].values()
            if g["sub"] == sub and g["client_id"] == client_id
            for s in g["scope"].split()
        }

    def open_grant(self, sub: str, client_id: str, scope: str) -> str:
        """A new sign-in, replacing the account's earlier ones with this client — the
        new one carries every scope they held."""
        for grant_id, g in list(self._data["grants"].items()):
            if g["sub"] == sub and g["client_id"] == client_id:
                self._drop_grant(grant_id)
        grant_id = secrets.token_urlsafe(16)
        self._data["grants"][grant_id] = {"sub": sub, "client_id": client_id, "scope": scope}
        self._save()
        return grant_id

    def grant(self, grant_id: str) -> dict | None:
        return self._data["grants"].get(grant_id)

    def _drop_grant(self, grant_id: str) -> None:
        self._data["grants"].pop(grant_id, None)
        for table in ("access_tokens", "refresh_tokens"):
            for h, t in list(self._data[table].items()):
                if t["grant_id"] == grant_id:
                    del self._data[table][h]

    def end_grant(self, grant_id: str) -> EndedSignIn | None:
        """Ends one sign-in and everything issued from it. When it was the account's
        last, the account's vendor token goes, and is returned for the upstream to
        revoke."""
        grant = self._data["grants"].get(grant_id)
        if grant is None:
            return None
        self._drop_grant(grant_id)
        sub = grant["sub"]
        ended = None
        if not any(g["sub"] == sub for g in self._data["grants"].values()):
            account = self._data["accounts"].get(sub)
            if account is not None:
                ended = EndedSignIn(sub, account.get("vendor_token"))
                account["vendor_token"] = None
        self._save()
        return ended

    # ---- tokens ----------------------------------------------------------------------

    def save_tokens(
        self, grant_id: str, access_token: str, expires_in: int, refresh_token: str | None
    ) -> None:
        now = time.time()
        self._data["access_tokens"] = {
            h: t for h, t in self._data["access_tokens"].items() if t["expires_at"] > now
        }
        self._data["access_tokens"][token_hash(access_token)] = {
            "grant_id": grant_id,
            "expires_at": now + expires_in,
        }
        if refresh_token is not None:
            self._data["refresh_tokens"][token_hash(refresh_token)] = {
                "grant_id": grant_id,
                "rotated": False,
            }
        self._save()

    def refresh_token(self, token: str) -> dict | None:
        found = self._data["refresh_tokens"].get(token_hash(token))
        return dict(found, hash=token_hash(token)) if found else None

    def rotate_refresh_token(self, token_hash_: str) -> None:
        if (found := self._data["refresh_tokens"].get(token_hash_)) is not None:
            found["rotated"] = True
            self._save()

    def access_token(self, token: str) -> dict | None:
        found = self._data["access_tokens"].get(token_hash(token))
        return dict(found, hash=token_hash(token)) if found else None

    def signed_in(self, token: str, kind: AccountKind) -> SignedInAccount | None:
        """The account a live access token stands for, under this mode's kind."""
        found = self._data["access_tokens"].get(token_hash(token))
        if found is None or found["expires_at"] <= time.time():
            return None
        grant = self._data["grants"].get(found["grant_id"])
        if grant is None:
            return None
        account = self._data["accounts"].get(grant["sub"])
        if account is None or account["kind"] != kind:
            return None
        return SignedInAccount(
            sub=grant["sub"],
            account_id=account["account_id"],
            claims=dict(account["claims"]),
            scopes=frozenset(grant["scope"].split()) - {"openid"},
            vendor_token=account.get("vendor_token"),
        )
