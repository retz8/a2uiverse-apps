"""A vendor's OAuth sign-in: the kit's upstream for a vendor that signs in with OAuth.

One class configured per vendor, on Authlib's client (task-12.10 decision 1). The kit's
sign-in page sends the person to the vendor's own sign-in — the authorization-code flow
with S256 PKCE, back to the agent's finish address — and the vendor's token comes home
to the agent, never to the client. The vendor client is the publisher's, registered by
hand and read from the agent's `.env`, or the agent's own, registered by dynamic
registration (RFC 7591) on the first sign-in and kept in the agent's store. The vendor
token is refreshed before a live request uses it, and revoked when the account's last
sign-in ends. Who signed in comes from the vendor through the app's `identify` hook.

A vendor that does not fit implements `UpstreamSignIn` directly.
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
import secrets
import time
from collections.abc import Awaitable, Callable, Mapping, Sequence
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

import httpx
from authlib.integrations.base_client.errors import OAuthError
from authlib.integrations.httpx_client import AsyncOAuth2Client
from starlette.requests import Request
from starlette.responses import RedirectResponse, Response

from a2ui_agent_kit.sign_in import PendingSignIn, UpstreamAccount, VendorSignInEnded

if TYPE_CHECKING:
    from a2ui_agent_kit.sign_in_store import SignInStore

logger = logging.getLogger(__name__)

# A vendor sign-in waits this long for the person to come back from the vendor.
FLOW_LIFETIME = 600
# A vendor token closer than this to its expiry is refreshed before a request uses it.
REFRESH_MARGIN = 300
# Where the agent's own registration at its vendor is kept in the store.
REGISTRATION_KEY = "vendor_client"

# (the vendor's token response, an HTTP client) -> the account's stable id and its
# display claims (`email`, `preferred_username`, `name` — whichever the vendor has).
# The token response carries `client_id`, the agent's client at the vendor.
Identify = Callable[[Mapping[str, Any], httpx.AsyncClient], Awaitable[tuple[str, dict[str, str]]]]
# (the vendor token, the agent's client id and secret, an HTTP client) -> None.
Revoke = Callable[[Mapping[str, Any], str, str | None, httpx.AsyncClient], Awaitable[None]]


class VendorSignInError(Exception):
    """The vendor's sign-in did not finish: refused, expired, or short of what was asked."""


@dataclass(frozen=True)
class ClientFromEnv:
    """The publisher's client at the vendor, registered by hand, read from the agent's
    environment (its `.env`)."""

    client_id_env: str
    client_secret_env: str

    def read(self, vendor: str) -> tuple[str, str]:
        client_id = os.environ.get(self.client_id_env)
        secret = os.environ.get(self.client_secret_env)
        if not client_id or not secret:
            raise VendorSignInError(
                f"{self.client_id_env} and {self.client_secret_env} must be set in the "
                f"agent's .env for live sign-in with {vendor} — see the agent's README."
            )
        return client_id, secret


@dataclass(frozen=True)
class _Client:
    client_id: str
    secret: str | None

    @property
    def auth_method(self) -> str:
        return "client_secret_post" if self.secret else "none"


@dataclass
class _Flow:
    pending_id: str
    verifier: str
    redirect_uri: str
    client: _Client
    vendor_scopes: tuple[str, ...]
    account_id: str | None
    expires_at: float


def split_scope(scope: str | Sequence[str] | None) -> set[str]:
    """A token response's granted scopes, space- or comma-separated (GitHub uses commas)."""
    if not scope:
        return set()
    if not isinstance(scope, str):
        return set(scope)
    return {s for s in scope.replace(",", " ").split() if s}


def id_token_claims(token: Mapping[str, Any], issuers: Sequence[str] = ()) -> dict[str, Any]:
    """The claims of the ID token in a token response the agent got straight from the
    vendor's token endpoint over TLS, where TLS stands in for the signature (OpenID Connect
    Core §3.1.3.7, step 6): its audience must be the agent's client, its issuer one of
    `issuers` when given, and it must not have expired."""
    raw = token.get("id_token")
    if not isinstance(raw, str) or raw.count(".") != 2:
        raise VendorSignInError("the vendor sent no ID token")
    payload = raw.split(".")[1]
    claims = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
    audience = claims.get("aud")
    audiences = audience if isinstance(audience, list) else [audience]
    if token.get("client_id") not in audiences:
        raise VendorSignInError("the ID token is for another client")
    if issuers and claims.get("iss") not in issuers:
        raise VendorSignInError("the ID token is from another issuer")
    if float(claims.get("exp", 0)) <= time.time():
        raise VendorSignInError("the ID token has expired")
    return claims


class VendorOAuth:
    """The upstream sign-in for a vendor that signs in with OAuth."""

    def __init__(
        self,
        *,
        vendor: str,
        scopes: Mapping[str, Sequence[str]],
        identify: Identify,
        identity_scopes: Sequence[str] = (),
        client: ClientFromEnv | None = None,
        metadata_url: str | None = None,
        authorization_endpoint: str | None = None,
        token_endpoint: str | None = None,
        revocation_endpoint: str | None = None,
        authorize_params: Mapping[str, str] | None = None,
        login_hint_param: str | None = None,
        resource: str | None = None,
        revoke: Revoke | None = None,
        refresh_margin: int = REFRESH_MARGIN,
    ):
        """`scopes` maps each of the app's scopes to the vendor scopes it needs;
        `identity_scopes` are asked on every sign-in, for `identify`. `client` is the
        publisher's client registered by hand; without it the agent registers itself by
        dynamic registration at the `registration_endpoint` the metadata names. Endpoints
        given here win over the metadata's. `login_hint_param` names the vendor's own
        parameter for the bound account's id, where it has one. `resource` is the vendor's
        MCP server, sent as the resource indicator (RFC 8707) the MCP authorization spec
        asks for. `revoke` replaces RFC 7009 revocation for a vendor that revokes its own
        way."""
        if client is None and metadata_url is None:
            raise ValueError("a vendor without a client of the publisher's needs its metadata_url")
        self.vendor = vendor
        self._scopes = {k: tuple(v) for k, v in scopes.items()}
        self._identity_scopes = tuple(identity_scopes)
        self._identify = identify
        self._client_from_env = client
        self._metadata_url = metadata_url
        self._given = {
            "authorization_endpoint": authorization_endpoint,
            "token_endpoint": token_endpoint,
            "revocation_endpoint": revocation_endpoint,
        }
        self._authorize_params = dict(authorize_params or {})
        self._login_hint_param = login_hint_param
        self._resource = {"resource": resource} if resource else {}
        self._revoke = revoke
        self._refresh_margin = refresh_margin
        self._metadata: dict[str, Any] | None = None
        self._flows: dict[str, _Flow] = {}
        self._store: SignInStore | None = None
        self._registering = asyncio.Lock()

    # ---- the kit's hooks ------------------------------------------------------------

    def attach(self, store: SignInStore) -> None:
        self._store = store

    def vendor_scopes(self, scopes: Sequence[str]) -> tuple[str, ...]:
        """The vendor scopes the app's `scopes` need, then the identity scopes."""
        wanted: list[str] = []
        for scope in scopes:
            for vendor_scope in self._scopes.get(scope, ()):
                if vendor_scope not in wanted:
                    wanted.append(vendor_scope)
        return tuple(wanted)

    async def start(self, request: Request, pending: PendingSignIn) -> Response:
        client = await self._client(pending.finish_url)
        vendor_scopes = self.vendor_scopes(pending.scopes)
        asked = [*vendor_scopes, *(s for s in self._identity_scopes if s not in vendor_scopes)]
        now = time.time()
        self._flows = {k: f for k, f in self._flows.items() if f.expires_at > now}
        state = secrets.token_urlsafe(24)
        verifier = secrets.token_urlsafe(48)
        self._flows[state] = _Flow(
            pending_id=pending.id,
            verifier=verifier,
            redirect_uri=pending.finish_url,
            client=client,
            vendor_scopes=vendor_scopes,
            account_id=pending.account_id,
            expires_at=now + FLOW_LIFETIME,
        )
        params = {**self._authorize_params, **self._resource}
        if pending.account_id is not None and self._login_hint_param:
            params[self._login_hint_param] = pending.account_id
        async with self._oauth(client, scope=" ".join(asked), redirect_uri=pending.finish_url) as oauth:
            url, _ = oauth.create_authorization_url(
                await self._endpoint("authorization_endpoint"),
                state=state,
                code_verifier=verifier,
                **params,
            )
        return RedirectResponse(url, status_code=302)

    async def finish(self, request: Request) -> tuple[str, UpstreamAccount]:
        query = request.query_params
        flow = self._flows.pop(query.get("state", ""), None)
        if flow is None or flow.expires_at <= time.time():
            raise VendorSignInError("no sign-in is waiting on this return")
        if error := query.get("error"):
            raise VendorSignInError(f"{self.vendor} refused the sign-in: {error}")
        code = query.get("code")
        if not code:
            raise VendorSignInError(f"{self.vendor} sent no code")
        try:
            async with self._oauth(flow.client) as oauth:
                token = dict(
                    await oauth.fetch_token(
                        await self._endpoint("token_endpoint"),
                        code=code,
                        code_verifier=flow.verifier,
                        redirect_uri=flow.redirect_uri,
                        **self._resource,
                    )
                )
        except OAuthError as error:
            if error.error == "invalid_client":
                self._drop_registration(flow.client)
            raise VendorSignInError(f"{self.vendor} refused the code: {error.error}") from error
        granted = split_scope(token.get("scope"))
        if granted and (short := [s for s in flow.vendor_scopes if s not in granted]):
            raise VendorSignInError(f"{self.vendor} granted less than was asked: {short}")
        token["client_id"] = flow.client.client_id
        async with httpx.AsyncClient(timeout=20) as http:
            account_id, claims = await self._identify(token, http)
        return flow.pending_id, UpstreamAccount(account_id, claims, self._kept(token))

    async def fresh(self, vendor_token: Mapping[str, Any]) -> dict[str, Any] | None:
        """A refreshed vendor token when the one held is near its expiry; None while it is
        good. Raises `VendorSignInEnded` when an expired token cannot be refreshed."""
        expires_at = vendor_token.get("expires_at")
        if expires_at is None or float(expires_at) - time.time() > self._refresh_margin:
            return None
        expired = float(expires_at) <= time.time()
        refresh_token = vendor_token.get("refresh_token")
        if not refresh_token:
            if expired:
                raise VendorSignInEnded(f"the {self.vendor} token expired and cannot be refreshed")
            return None
        try:
            client = self._client_for(vendor_token)
            async with self._oauth(client) as oauth:
                renewed = dict(
                    await oauth.refresh_token(
                        await self._endpoint("token_endpoint"),
                        refresh_token=refresh_token,
                        **self._resource,
                    )
                )
        except (OAuthError, VendorSignInError, httpx.HTTPError) as error:
            if expired or isinstance(error, (OAuthError, VendorSignInError)):
                raise VendorSignInEnded(f"the {self.vendor} token could not be refreshed") from error
            logger.warning("%s token refresh failed; the current token is kept", self.vendor)
            return None
        renewed.setdefault("refresh_token", refresh_token)
        renewed["client_id"] = vendor_token.get("client_id")
        return self._kept(renewed)

    async def revoke(self, vendor_token: Mapping[str, Any]) -> None:
        client = self._client_for(vendor_token)
        async with httpx.AsyncClient(timeout=20) as http:
            if self._revoke is not None:
                await self._revoke(vendor_token, client.client_id, client.secret, http)
                return
            endpoint = await self._endpoint("revocation_endpoint", required=False)
            if endpoint is None:
                return
            token = vendor_token.get("refresh_token") or vendor_token.get("access_token")
            hint = "refresh_token" if vendor_token.get("refresh_token") else "access_token"
            data = {"token": token, "token_type_hint": hint, "client_id": client.client_id}
            if client.secret:
                data["client_secret"] = client.secret
            response = await http.post(endpoint, data=data)
            response.raise_for_status()

    # ---- the vendor's token ---------------------------------------------------------

    @staticmethod
    def _kept(token: Mapping[str, Any]) -> dict[str, Any]:
        """What the store keeps of a token response: no ID token, an absolute expiry."""
        kept = {
            k: token[k]
            for k in ("access_token", "refresh_token", "token_type", "scope", "client_id")
            if token.get(k) is not None
        }
        if token.get("expires_in") is not None:
            kept["expires_at"] = int(time.time()) + int(token["expires_in"])
        return kept

    # ---- the vendor's metadata and the agent's client --------------------------------

    async def _discover(self) -> dict[str, Any]:
        if self._metadata is None:
            if self._metadata_url is None:
                self._metadata = {}
            else:
                async with httpx.AsyncClient(timeout=20) as http:
                    response = await http.get(self._metadata_url)
                    response.raise_for_status()
                    self._metadata = response.json()
        return self._metadata

    async def _endpoint(self, name: str, required: bool = True) -> str | None:
        if self._given.get(name):
            return self._given[name]
        found = (await self._discover()).get(name)
        if found is None and required:
            raise VendorSignInError(f"{self.vendor} advertises no {name}")
        return found

    def _oauth(
        self, client: _Client, scope: str | None = None, redirect_uri: str | None = None
    ) -> AsyncOAuth2Client:
        return AsyncOAuth2Client(
            client_id=client.client_id,
            client_secret=client.secret,
            scope=scope,
            redirect_uri=redirect_uri,
            code_challenge_method="S256",
            token_endpoint_auth_method=client.auth_method,
            timeout=20,
        )

    def _client_for(self, vendor_token: Mapping[str, Any]) -> _Client:
        """The agent's client a vendor token was issued to."""
        if self._client_from_env is not None:
            return _Client(*self._client_from_env.read(self.vendor))
        held = self._store.upstream_data(REGISTRATION_KEY) if self._store else None
        client_id = vendor_token.get("client_id") or (held or {}).get("client_id")
        if not client_id:
            raise VendorSignInError(f"no {self.vendor} client is registered")
        secret = held.get("client_secret") if held and held.get("client_id") == client_id else None
        return _Client(client_id, secret)

    async def _client(self, redirect_uri: str) -> _Client:
        """The agent's client at the vendor for a sign-in returning to `redirect_uri`."""
        if self._client_from_env is not None:
            return _Client(*self._client_from_env.read(self.vendor))
        if self._store is None:
            raise VendorSignInError("dynamic registration needs the agent's sign-in store")
        async with self._registering:
            held = self._store.upstream_data(REGISTRATION_KEY)
            if held and held.get("redirect_uri") == redirect_uri:
                return _Client(held["client_id"], held.get("client_secret"))
            registration = await self._register(redirect_uri)
            self._store.save_upstream_data(REGISTRATION_KEY, registration)
            return _Client(registration["client_id"], registration.get("client_secret"))

    async def _register(self, redirect_uri: str) -> dict[str, Any]:
        metadata = await self._discover()
        endpoint = metadata.get("registration_endpoint")
        if not endpoint:
            raise VendorSignInError(f"{self.vendor} offers no dynamic registration")
        offered = metadata.get("grant_types_supported", ["authorization_code", "refresh_token"])
        grants = [g for g in ("authorization_code", "refresh_token") if g in offered]
        body = {
            "client_name": "A2UIVerse agent",
            "redirect_uris": [redirect_uri],
            "grant_types": grants,
            "response_types": ["code"],
            "token_endpoint_auth_method": "none",
        }
        async with httpx.AsyncClient(timeout=20) as http:
            response = await http.post(endpoint, json=body)
        if response.status_code not in (200, 201):
            raise VendorSignInError(
                f"{self.vendor} refused the registration ({response.status_code})"
            )
        registered = response.json()
        logger.info("registered with %s by dynamic registration", self.vendor)
        return {
            "client_id": registered["client_id"],
            **({"client_secret": registered["client_secret"]} if registered.get("client_secret") else {}),
            "redirect_uri": redirect_uri,
        }

    def _drop_registration(self, client: _Client) -> None:
        if self._client_from_env is None and self._store is not None:
            held = self._store.upstream_data(REGISTRATION_KEY)
            if held and held.get("client_id") == client.client_id:
                self._store.save_upstream_data(REGISTRATION_KEY, None)
