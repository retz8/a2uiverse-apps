"""The kit's sign-in front door: an OAuth authorization server on Authlib (task-12.9).

The AuthVault signs in here as a public client — authorization code with S256 PKCE,
then refresh — registered by a client ID metadata document or by dynamic registration
(RFC 7591). The account comes from the upstream sign-in: the fake chooser in
deterministic and stub mode, the app's vendor sign-in in live mode. The agent issues
opaque tokens, an OpenID Connect ID token signed ES256, rotates refresh tokens, and
revokes (RFC 7009). An A2A request without a live token it issued is answered 401.

Authlib's server core is framework-neutral; this module is its Starlette adapter. Its
calls are synchronous, so everything a call needs from the network — a client ID
metadata document — is fetched before it.
"""

from __future__ import annotations

import asyncio
import dataclasses
import functools
import hmac
import logging
import secrets
import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any
from urllib.parse import urlencode, urlsplit

import httpx
from a2a.types import (
    APIKeySecurityScheme,
    AuthorizationCodeOAuthFlow,
    OAuth2SecurityScheme,
    In,
    OAuthFlows,
    SecurityScheme,
)
from authlib.common.security import is_secure_transport
from authlib.oauth2 import AuthorizationServer
from authlib.oauth2.rfc6749 import (
    ClientMixin,
    JsonPayload,
    JsonRequest,
    OAuth2Error,
    OAuth2Payload,
    OAuth2Request,
    grants,
)
from authlib.oauth2.rfc6749.errors import AccessDeniedError, InvalidRequestError
from authlib.oauth2.rfc6750 import BearerTokenGenerator
from authlib.oauth2.rfc7009 import RevocationEndpoint
from authlib.oauth2.rfc7591 import ClientRegistrationEndpoint
from authlib.oauth2.rfc7591.errors import InvalidClientMetadataError
from authlib.oauth2.rfc7636 import CodeChallenge
from authlib.oidc.core import grants as oidc_grants
from starlette.datastructures import Headers
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.routing import Route

from a2ui_agent_kit.sign_in import (
    API_KEY_SCHEME_KEY,
    OPENID_SCOPE,
    SCHEME_KEY,
    ApiKeySignIn,
    PendingSignIn,
    SignedInAccount,
    SignIn,
    UpstreamAccount,
    VendorSignInEnded,
)
from a2ui_agent_kit.sign_in_fake import FakeAccountChooser, message_page
from a2ui_agent_kit.sign_in_store import AccountKind, EndedSignIn, SignInStore

logger = logging.getLogger(__name__)

ACCESS_TOKEN_LIFETIME = 3600
AUTHORIZATION_CODE_LIFETIME = 600  # RFC 6749 §4.1.2: ten minutes at most
PENDING_SIGN_IN_LIFETIME = 600
ID_TOKEN_ALG = "ES256"
DISPLAY_CLAIMS = ("email", "preferred_username", "name")

# The non-interactive entry: names a fake account, deterministic and stub mode.
FAKE_ACCOUNT_PARAM = "fake_account"

AUTHORIZE_PATH = "/oauth/authorize"
TOKEN_PATH = "/oauth/token"
REGISTER_PATH = "/oauth/register"
REVOKE_PATH = "/oauth/revoke"
JWKS_PATH = "/oauth/jwks"
FINISH_PATH = "/sign-in/finish"
METADATA_PATH = "/.well-known/oauth-authorization-server"
OPENID_METADATA_PATH = "/.well-known/openid-configuration"


def _join_scope(scopes) -> str:
    scopes = set(scopes)
    head = [OPENID_SCOPE] if OPENID_SCOPE in scopes else []
    return " ".join(head + sorted(scopes - {OPENID_SCOPE}))


# ---- the card ----------------------------------------------------------------------


def card_security(sign_in: SignIn, base_url: str, public_url: str | None = None):
    """The card's `securitySchemes` and `security` (task-12.9 decision 13). The sign-in page
    is on the public address the browser reaches; the rest stays on the agent's own
    (task-12.12 decision 1)."""
    issuer = base_url.rstrip("/")
    public = (public_url or base_url).rstrip("/")
    scheme = OAuth2SecurityScheme(
        flows=OAuthFlows(
            authorization_code=AuthorizationCodeOAuthFlow(
                authorization_url=f"{public}{AUTHORIZE_PATH}",
                token_url=f"{issuer}{TOKEN_PATH}",
                refresh_url=f"{issuer}{TOKEN_PATH}",
                scopes=dict(sign_in.scopes),
            )
        ),
        oauth2_metadata_url=f"{issuer}{METADATA_PATH}",
    )
    return (
        {SCHEME_KEY: SecurityScheme(root=scheme)},
        [{SCHEME_KEY: list(sign_in.first_sign_in_scopes)}],
    )


def api_key_card_security(sign_in: ApiKeySignIn):
    """The card's `apiKey` scheme in a header, and the `security` requiring it."""
    scheme = APIKeySecurityScheme(
        in_=In.header, name=sign_in.header, description=sign_in.description
    )
    return {API_KEY_SCHEME_KEY: SecurityScheme(root=scheme)}, [{API_KEY_SCHEME_KEY: []}]


# ---- Authlib's models --------------------------------------------------------------


@dataclass
class _Client(ClientMixin):
    client_id: str
    redirect_uris: list[str]
    allowed_scopes: frozenset[str]
    grant_types: tuple[str, ...] = ("authorization_code", "refresh_token")

    def get_client_id(self):
        return self.client_id

    def get_default_redirect_uri(self):
        return self.redirect_uris[0] if len(self.redirect_uris) == 1 else None

    def get_allowed_scope(self, scope):
        if not scope:
            return ""
        return _join_scope(s for s in scope.split() if s in self.allowed_scopes)

    def check_redirect_uri(self, redirect_uri):
        # RFC 9700 §4.1.3: exact string matching.
        return redirect_uri in self.redirect_uris

    def check_client_secret(self, client_secret):
        return False

    def check_endpoint_auth_method(self, method, endpoint):
        return method == "none"

    def check_response_type(self, response_type):
        return response_type == "code"

    def check_grant_type(self, grant_type):
        return grant_type in self.grant_types


@dataclass
class _User:
    sub: str
    claims: dict[str, str]
    account_id: str


@dataclass
class _Code:
    code: str
    client_id: str
    redirect_uri: str
    scope: str
    user: _User
    code_challenge: str
    code_challenge_method: str
    nonce: str | None
    auth_time: int
    expires_at: float

    def get_redirect_uri(self):
        return self.redirect_uri

    def get_scope(self):
        return self.scope

    def get_nonce(self):
        return self.nonce

    def get_auth_time(self):
        return self.auth_time

    def get_acr(self):
        return None

    def get_amr(self):
        return None


@dataclass
class _Token:
    hash: str
    grant_id: str
    client_id: str
    scope: str
    sub: str

    def check_client(self, client):
        return client.get_client_id() == self.client_id

    def get_scope(self):
        return self.scope

    def get_expires_in(self):
        return 0

    def is_expired(self):
        return False

    def is_revoked(self):
        return False

    def get_user(self):
        return None

    def get_client(self):
        return None


# ---- Starlette requests for Authlib -----------------------------------------------


class _Payload(OAuth2Payload):
    def __init__(self, items: list[tuple[str, str]]):
        self._data = {}
        self._datalist = defaultdict(list)
        for key, value in items:
            self._data.setdefault(key, value)
            self._datalist[key].append(value)

    @property
    def data(self):
        return self._data

    @property
    def datalist(self):
        return self._datalist


class _Request(OAuth2Request):
    def __init__(self, method, uri, headers, args: list, form: list):
        super().__init__(method=method, uri=uri, headers=headers)
        self._args = dict(args)
        self._form = dict(form)
        self.payload = _Payload([*args, *form])

    @property
    def args(self):
        return self._args

    @property
    def form(self):
        return self._form


class _JsonPayload(JsonPayload):
    def __init__(self, data):
        self._data = data

    @property
    def data(self):
        return self._data


class _JsonRequest(JsonRequest):
    def __init__(self, method, uri, headers, data):
        super().__init__(method, uri, headers)
        self.payload = _JsonPayload(data)


# ---- grants and endpoints ------------------------------------------------------------


class _S256(CodeChallenge):
    """PKCE, S256 only, required at the authorization request."""

    SUPPORTED_CODE_CHALLENGE_METHOD = ["S256"]
    DEFAULT_CODE_CHALLENGE_METHOD = "S256"

    def validate_code_challenge(self, grant, redirect_uri):
        data = grant.request.payload.data
        if not data.get("code_challenge"):
            raise InvalidRequestError("Missing 'code_challenge'")
        if data.get("code_challenge_method") != "S256":
            raise InvalidRequestError("'code_challenge_method' must be 'S256'")
        super().validate_code_challenge(grant, redirect_uri)

    def get_authorization_code_challenge(self, authorization_code):
        return authorization_code.code_challenge

    def get_authorization_code_challenge_method(self, authorization_code):
        return authorization_code.code_challenge_method


class _AuthorizationCodeGrant(grants.AuthorizationCodeGrant):
    TOKEN_ENDPOINT_AUTH_METHODS = ["none"]

    def save_authorization_code(self, code, request):
        # The new sign-in carries what the account already granted this client
        # (task-12.9 decision 10).
        sign_in: SignInServer = self.server.sign_in
        user: _User = request.user
        client_id = request.client.get_client_id()
        scope = _join_scope(
            {*request.scope.split(), *sign_in.store.granted_scopes(user.sub, client_id)}
        )
        data = request.payload.data
        sign_in.codes[code] = _Code(
            code=code,
            client_id=client_id,
            redirect_uri=request.payload.redirect_uri,
            scope=scope,
            user=user,
            code_challenge=data["code_challenge"],
            code_challenge_method=data["code_challenge_method"],
            nonce=data.get("nonce"),
            auth_time=int(time.time()),
            expires_at=time.time() + AUTHORIZATION_CODE_LIFETIME,
        )

    def query_authorization_code(self, code, client):
        found = self.server.sign_in.codes.get(code)
        if found and found.client_id == client.get_client_id() and found.expires_at > time.time():
            return found
        return None

    def delete_authorization_code(self, authorization_code):
        self.server.sign_in.codes.pop(authorization_code.code, None)

    def authenticate_user(self, authorization_code):
        return authorization_code.user


class _RefreshTokenGrant(grants.RefreshTokenGrant):
    TOKEN_ENDPOINT_AUTH_METHODS = ["none"]
    # RFC 9700 §4.14.2: a public client's refresh tokens rotate.
    INCLUDE_NEW_REFRESH_TOKEN = True

    def authenticate_refresh_token(self, refresh_token):
        sign_in: SignInServer = self.server.sign_in
        found = sign_in.store.refresh_token(refresh_token)
        if found is None:
            return None
        if found["rotated"]:
            # A rotated token used again: the sign-in is treated as stolen and ended.
            sign_in.end_grant(found["grant_id"])
            return None
        grant = sign_in.store.grant(found["grant_id"])
        account = sign_in.store.account(grant["sub"]) if grant else None
        if account is None or account["kind"] != sign_in.kind:
            return None
        return _Token(found["hash"], found["grant_id"], grant["client_id"], grant["scope"], grant["sub"])

    def authenticate_user(self, refresh_token):
        account = self.server.sign_in.store.account(refresh_token.sub)
        return _User(refresh_token.sub, account["claims"], account["account_id"])

    def revoke_old_credential(self, refresh_token):
        self.server.sign_in.store.rotate_refresh_token(refresh_token.hash)


class _OpenIDCode(oidc_grants.OpenIDCode):
    def __init__(self, sign_in: SignInServer):
        super().__init__(require_nonce=False)
        self._sign_in = sign_in

    def resolve_client_private_key(self, client):
        return self._sign_in.store.signing_key()

    def get_client_algorithm(self, client):
        return ID_TOKEN_ALG

    def get_encode_header(self, client):
        return {"alg": ID_TOKEN_ALG, "kid": self._sign_in.store.signing_kid()}

    def get_client_claims(self, client):
        return {"iss": self._sign_in.issuer, "aud": [client.get_client_id()]}

    def exists_nonce(self, nonce, request):
        return False

    def generate_user_info(self, user, scope):
        claims = {k: user.claims[k] for k in DISPLAY_CLAIMS if user.claims.get(k)}
        return {"sub": user.sub, **claims}


class _Revocation(RevocationEndpoint):
    CLIENT_AUTH_METHODS = ["none"]

    def query_token(self, token_string, token_type_hint):
        store = self.server.sign_in.store
        found = None
        if token_type_hint != "refresh_token":
            found = store.access_token(token_string)
        if found is None:
            found = store.refresh_token(token_string)
        if found is None:
            return None
        grant = store.grant(found["grant_id"])
        if grant is None:
            return None
        return _Token(found["hash"], found["grant_id"], grant["client_id"], grant["scope"], grant["sub"])

    def revoke_token(self, token, request):
        # Any token ends its whole sign-in (task-12.9 decision 14).
        self.server.sign_in.end_grant(token.grant_id)


class _Registration(ClientRegistrationEndpoint):
    def authenticate_token(self, request):
        return "anonymous"  # open registration, for public clients only

    def get_server_metadata(self):
        return self.server.sign_in.metadata()

    def generate_client_info(self, request):
        return {
            "client_id": secrets.token_urlsafe(24),
            "client_id_issued_at": int(time.time()),
        }

    def save_client(self, client_info, client_metadata, request):
        if client_metadata.get("token_endpoint_auth_method") != "none":
            raise InvalidClientMetadataError(
                "Only public clients register here: token_endpoint_auth_method 'none'."
            )
        if not client_metadata.get("redirect_uris"):
            raise InvalidClientMetadataError("redirect_uris is required.")
        self.server.sign_in.store.save_client(
            client_info["client_id"],
            {"redirect_uris": list(client_metadata["redirect_uris"]), **client_info},
        )
        return client_info


class _Server(AuthorizationServer):
    def __init__(self, sign_in: SignInServer):
        super().__init__(scopes_supported=[OPENID_SCOPE, *sign_in.config.scopes])
        self.sign_in = sign_in

    def query_client(self, client_id):
        return self.sign_in.client(client_id)

    def save_token(self, token, request):
        if request.payload.grant_type == "authorization_code":
            code: _Code = request.authorization_code
            grant_id = self.sign_in.store.open_grant(code.user.sub, code.client_id, code.scope)
        else:
            grant_id = request.refresh_token.grant_id
        self.sign_in.store.save_tokens(
            grant_id, token["access_token"], token["expires_in"], token.get("refresh_token")
        )

    def create_oauth2_request(self, request):
        return request

    def create_json_request(self, request):
        return request

    def handle_response(self, status, body, headers):
        headers = dict(headers or [])
        if isinstance(body, dict):
            return JSONResponse(body, status_code=status, headers=headers)
        return Response(body or "", status_code=status, headers=headers)

    def send_signal(self, name, *args, **kwargs):
        pass


# ---- the sign-in server -------------------------------------------------------------


@dataclass
class _Pending:
    sign_in: PendingSignIn
    args: list[tuple[str, str]]
    expires_at: float


@dataclass
class SignInServer:
    """The authorization server for one app run: its routes, its 401 gate."""

    config: SignIn
    app_name: str
    mode: str
    base_url: str
    store: SignInStore
    access_token_lifetime: int = ACCESS_TOKEN_LIFETIME
    # Where the browser reaches the pages it opens — the sign-in page, the chooser's form,
    # the finish address a vendor returns to; the issuer and every other endpoint stay on
    # `base_url` (task-12.12 decision 1).
    public_url: str | None = None
    codes: dict[str, _Code] = field(default_factory=dict)
    _pending: dict[str, _Pending] = field(default_factory=dict)
    _metadata_clients: dict[str, _Client] = field(default_factory=dict)
    _ended: list[EndedSignIn] = field(default_factory=list)
    _refreshing: dict[str, asyncio.Lock] = field(default_factory=dict)

    def __post_init__(self) -> None:
        self.issuer = self.base_url.rstrip("/")
        self.public = (self.public_url or self.base_url).rstrip("/")
        if self.mode == "live":
            if self.config.upstream is None:
                raise ValueError(
                    "--mode live with sign-in needs an upstream sign-in on the app config."
                )
            self.upstream = self.config.upstream
        else:
            self.upstream = FakeAccountChooser(self.config.fake_accounts, self.app_name)
        self.kind: AccountKind = "vendor" if self.mode == "live" else "fake"
        if (attach := getattr(self.upstream, "attach", None)) is not None:
            attach(self.store)
        server = _Server(self)
        server.register_token_generator(
            "default",
            BearerTokenGenerator(
                access_token_generator=lambda **_: secrets.token_urlsafe(32),
                refresh_token_generator=lambda **_: secrets.token_urlsafe(48),
                expires_generator=lambda client, grant_type: self.access_token_lifetime,
            ),
        )
        server.register_grant(_AuthorizationCodeGrant, [_S256(required=True), _OpenIDCode(self)])
        server.register_grant(_RefreshTokenGrant)
        server.register_endpoint(_Revocation)
        server.register_endpoint(_Registration)
        self.server = server

    # ---- clients ------------------------------------------------------------------

    def client(self, client_id: str) -> _Client | None:
        allowed = frozenset({OPENID_SCOPE, *self.config.scopes})
        if client_id in self._metadata_clients:
            return self._metadata_clients[client_id]
        registered = self.store.registered_client(client_id)
        if registered is not None:
            return _Client(client_id, list(registered["redirect_uris"]), allowed)
        return None

    async def _resolve_metadata_client(self, client_id: str | None) -> None:
        """Fetches a client ID metadata document, when the client id is its URL."""
        if not client_id or "://" not in client_id or client_id in self._metadata_clients:
            return
        parts = urlsplit(client_id)
        if not parts.path or parts.path == "/" or not is_secure_transport(client_id):
            return  # https only, localhost exempt; not a metadata document client id
        try:
            async with httpx.AsyncClient(timeout=10, follow_redirects=False) as http:
                response = await http.get(client_id, headers={"Accept": "application/json"})
            document = response.json() if response.status_code == 200 else None
        except (httpx.HTTPError, ValueError):
            logger.warning("client metadata document %s could not be fetched", client_id)
            return
        if not isinstance(document, dict) or document.get("client_id") != client_id:
            return
        redirect_uris = document.get("redirect_uris")
        if not isinstance(redirect_uris, list) or not all(isinstance(u, str) for u in redirect_uris):
            return
        if document.get("token_endpoint_auth_method", "none") != "none":
            return
        self._metadata_clients[client_id] = _Client(
            client_id, redirect_uris, frozenset({OPENID_SCOPE, *self.config.scopes})
        )

    # ---- requests ---------------------------------------------------------------

    def _uri(self, request: Request) -> str:
        # The public URL: behind a tunnel the bind address is not what the client used.
        query = f"?{request.url.query}" if request.url.query else ""
        return f"{self.issuer}{request.url.path}{query}"

    async def _oauth_request(self, request: Request) -> _Request:
        args = list(request.query_params.multi_items())
        form = []
        if request.method == "POST":
            form = [(k, str(v)) for k, v in (await request.form()).multi_items()]
        return _Request(request.method, self._uri(request), dict(request.headers), args, form)

    def _request_from_args(self, args: list[tuple[str, str]]) -> _Request:
        return _Request("GET", f"{self.issuer}{AUTHORIZE_PATH}?{urlencode(args)}", {}, args, [])

    # ---- sign-ins -----------------------------------------------------------------

    def end_grant(self, grant_id: str) -> None:
        if (ended := self.store.end_grant(grant_id)) is not None:
            self._ended.append(ended)

    async def end_account(self, sub: str) -> None:
        """Ends every sign-in of the account and revokes its vendor token (task-12.10
        decision 7): the client's next request is refused, its refresh fails, and it asks
        the person to sign in again."""
        if (ended := self.store.end_account(sub)) is not None:
            self._ended.append(ended)
        await self._revoke_ended()

    async def fresh(self, account: SignedInAccount) -> SignedInAccount | None:
        """The account with a vendor token good for the request: refreshed first where
        the upstream says it is due, one refresh per account at a time. None when it
        could not be refreshed — the account's sign-ins are then ended."""
        refresh = getattr(self.upstream, "fresh", None)
        if self.kind != "vendor" or refresh is None or account.vendor_token is None:
            return account
        lock = self._refreshing.setdefault(account.sub, asyncio.Lock())
        async with lock:
            held = (self.store.account(account.sub) or {}).get("vendor_token")
            if held is None:
                return None
            try:
                renewed = await refresh(held)
            except VendorSignInEnded:
                logger.info("vendor token could not be refreshed; the account's sign-ins end")
                await self.end_account(account.sub)
                return None
            if renewed is not None:
                self.store.set_vendor_token(account.sub, renewed)
                held = renewed
        return dataclasses.replace(account, vendor_token=dict(held))

    async def _revoke_ended(self) -> None:
        """Revokes at the vendor every vendor token whose account's last sign-in ended."""
        ended, self._ended = self._ended, []
        revoke = getattr(self.upstream, "revoke", None)
        for item in ended:
            if item.vendor_token is not None and revoke is not None:
                try:
                    await revoke(item.vendor_token)
                except Exception:  # best-effort: the agent already let the token go
                    logger.warning("vendor revocation failed", exc_info=True)

    def _error(self, oreq: _Request, error: OAuth2Error) -> Response:
        if getattr(error, "redirect_uri", None):
            error.state = oreq.payload.state
            return self.server.handle_error_response(oreq, error)
        return message_page(
            "This sign-in link isn't working",
            "Close this window and try signing in again.",
        )

    def _complete(self, args: list[tuple[str, str]], account: UpstreamAccount) -> Response:
        sub = self.store.upsert_account(self.kind, account.id, account.claims, account.vendor_token)
        user = _User(sub, dict(account.claims), account.id)
        oreq = self._request_from_args(args)
        try:
            grant = self.server.get_consent_grant(request=oreq, end_user=user)
        except OAuth2Error as error:
            return self._error(oreq, error)
        return self.server.create_authorization_response(request=oreq, grant_user=user, grant=grant)

    async def authorize(self, request: Request) -> Response:
        await self._resolve_metadata_client(request.query_params.get("client_id"))
        oreq = await self._oauth_request(request)
        try:
            grant = self.server.get_consent_grant(request=oreq)
        except OAuth2Error as error:
            return self._error(oreq, error)
        redirect_uri = grant.validate_authorization_redirect_uri(oreq, grant.request.client)
        data = oreq.payload.data
        args = [(k, v) for k, vs in oreq.payload.datalist.items() for v in vs]
        asked = {s for s in grant.request.scope.split() if s != OPENID_SCOPE}

        def refuse(description: str, error=InvalidRequestError) -> Response:
            return self._error(oreq, error(description, redirect_uri=redirect_uri))

        # login_hint binds the sign-in to that account (task-12.9 decision 10). A hint
        # naming no account here — this agent lost it — binds nothing: the person
        # chooses, and the vault re-binds its account (a2uiverse task-12.13 decision 24).
        bound = None
        hint = data.get("login_hint")
        account = self.store.account(hint) if hint else None
        if account is not None and account["kind"] == self.kind:
            bound = account["account_id"]
            # What the account already granted rides along: the sign-in grants the union.
            granted = self.store.granted_scopes(hint, grant.request.client.get_client_id())
            asked |= granted - {OPENID_SCOPE}
        scopes = tuple(sorted(asked))

        fake = data.get(FAKE_ACCOUNT_PARAM)
        if fake is not None:
            if self.mode == "live":
                return refuse(f"'{FAKE_ACCOUNT_PARAM}' is for the fake accounts, not live mode.")
            account = self.upstream.account(fake)
            if account is None:
                return refuse(f"'{FAKE_ACCOUNT_PARAM}' names no account.")
            if bound is not None and account.id != bound:
                return refuse("Signed in as a different account.", AccessDeniedError)
            return self._complete(args, account)
        if bound is not None and isinstance(self.upstream, FakeAccountChooser):
            return self._complete(args, self.upstream.account(bound))

        now = time.time()
        self._pending = {k: p for k, p in self._pending.items() if p.expires_at > now}
        pending = PendingSignIn(
            id=secrets.token_urlsafe(24),
            scopes=scopes,
            account_id=bound,
            finish_url=f"{self.public}{FINISH_PATH}",
        )
        self._pending[pending.id] = _Pending(pending, args, now + PENDING_SIGN_IN_LIFETIME)
        try:
            return await self.upstream.start(request, pending)
        except Exception:
            logger.warning("upstream sign-in did not start", exc_info=True)
            self._pending.pop(pending.id, None)
            return message_page(
                "Sign-in isn't available right now", "Close this window and try again later."
            )

    async def finish(self, request: Request) -> Response:
        try:
            pending_id, account = await self.upstream.finish(request)
        except Exception:
            logger.warning("upstream sign-in did not finish", exc_info=True)
            return message_page(
                "Sign-in didn't finish", "Close this window and try signing in again."
            )
        pending = self._pending.pop(pending_id, None)
        if pending is None or pending.expires_at <= time.time():
            return message_page(
                "This sign-in has expired", "Close this window and try signing in again."
            )
        if pending.sign_in.account_id is not None and account.id != pending.sign_in.account_id:
            oreq = self._request_from_args(pending.args)
            grant = self.server.get_consent_grant(request=oreq)
            redirect_uri = grant.validate_authorization_redirect_uri(oreq, grant.request.client)
            return self._error(
                oreq, AccessDeniedError("Signed in as a different account.", redirect_uri=redirect_uri)
            )
        return self._complete(pending.args, account)

    async def token(self, request: Request) -> Response:
        await self._resolve_metadata_client((await request.form()).get("client_id"))
        response = self.server.create_token_response(await self._oauth_request(request))
        response.headers["Cache-Control"] = "no-store"
        await self._revoke_ended()
        return response

    async def revoke(self, request: Request) -> Response:
        await self._resolve_metadata_client((await request.form()).get("client_id"))
        response = self.server.create_endpoint_response(
            "revocation", await self._oauth_request(request)
        )
        await self._revoke_ended()
        return response

    async def register(self, request: Request) -> Response:
        try:
            data = await request.json()
        except ValueError:
            data = None
        jreq = _JsonRequest("POST", self._uri(request), dict(request.headers), data)
        return self.server.create_endpoint_response("client_registration", jreq)

    def metadata(self) -> dict[str, Any]:
        issuer = self.issuer
        return {
            "issuer": issuer,
            "authorization_endpoint": f"{self.public}{AUTHORIZE_PATH}",
            "token_endpoint": f"{issuer}{TOKEN_PATH}",
            "registration_endpoint": f"{issuer}{REGISTER_PATH}",
            "revocation_endpoint": f"{issuer}{REVOKE_PATH}",
            "jwks_uri": f"{issuer}{JWKS_PATH}",
            "scopes_supported": [OPENID_SCOPE, *self.config.scopes],
            "response_types_supported": ["code"],
            "grant_types_supported": ["authorization_code", "refresh_token"],
            "code_challenge_methods_supported": ["S256"],
            "token_endpoint_auth_methods_supported": ["none"],
            "revocation_endpoint_auth_methods_supported": ["none"],
            "subject_types_supported": ["public"],
            "id_token_signing_alg_values_supported": [ID_TOKEN_ALG],
            "claims_supported": ["sub", *DISPLAY_CLAIMS],
            "client_id_metadata_document_supported": True,
        }

    async def _metadata(self, request: Request) -> Response:
        return JSONResponse(self.metadata())

    async def _jwks(self, request: Request) -> Response:
        return JSONResponse(self.store.public_jwks())

    def routes(self) -> list[Route]:
        return [
            Route(METADATA_PATH, self._metadata, methods=["GET"]),
            Route(OPENID_METADATA_PATH, self._metadata, methods=["GET"]),
            Route(JWKS_PATH, self._jwks, methods=["GET"]),
            Route(AUTHORIZE_PATH, self.authorize, methods=["GET"]),
            Route(FINISH_PATH, self.finish, methods=["GET", "POST"]),
            Route(TOKEN_PATH, self.token, methods=["POST"]),
            Route(REVOKE_PATH, self.revoke, methods=["POST"]),
            Route(REGISTER_PATH, self.register, methods=["POST"]),
        ]


# ---- the 401 gate ---------------------------------------------------------------------


class _Principal:
    """The Starlette user a2a-sdk's call context reads; the account rides `auth`."""

    is_authenticated = True

    def __init__(self, sub: str):
        self.display_name = sub
        self.identity = sub


class SignInGate:
    """An A2A request must carry a live token this agent issued (RFC 6750 §3).

    The account it stands for rides the ASGI scope's `auth`, which a2a-sdk puts on the
    call context the executor reads. The card and the sign-in routes stay open.
    """

    def __init__(self, app, sign_in: SignInServer, rpc_path: str = "/"):
        self.app = app
        self._sign_in = sign_in
        self._rpc_path = rpc_path

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http" and scope["method"] == "POST" and scope["path"] == self._rpc_path:
            header = Headers(scope=scope).get("authorization", "")
            scheme, _, token = header.partition(" ")
            if scheme.lower() != "bearer" or not token.strip():
                return await _unauthorized(None)(scope, receive, send)
            account = self._sign_in.store.signed_in(token.strip(), self._sign_in.kind)
            if account is not None:
                account = await self._sign_in.fresh(account)
            if account is None:
                return await _unauthorized("invalid_token")(scope, receive, send)
            scope["user"] = _Principal(account.sub)
            scope["auth"] = dataclasses.replace(
                account, end_sign_ins=functools.partial(self._sign_in.end_account, account.sub)
            )
        await self.app(scope, receive, send)


class ApiKeyGate:
    """An A2A request must carry one of the app's keys in its header; the account the key
    signs in rides the ASGI scope's `auth`. The card stays open."""

    def __init__(self, app, sign_in: ApiKeySignIn, rpc_path: str = "/"):
        self.app = app
        self._sign_in = sign_in
        self._rpc_path = rpc_path

    def _account(self, key: str) -> SignedInAccount | None:
        for valid, account in self._sign_in.keys.items():
            if hmac.compare_digest(valid.encode(), key.encode()):
                return SignedInAccount(
                    sub=account.id,
                    account_id=account.id,
                    claims=dict(account.claims),
                    scopes=frozenset(),
                )
        return None

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http" and scope["method"] == "POST" and scope["path"] == self._rpc_path:
            key = Headers(scope=scope).get(self._sign_in.header, "").strip()
            account = self._account(key) if key else None
            if account is None:
                response = JSONResponse({"error": "unauthorized"}, status_code=401)
                return await response(scope, receive, send)
            scope["user"] = _Principal(account.sub)
            scope["auth"] = account
        await self.app(scope, receive, send)


def _unauthorized(error: str | None) -> Response:
    # RFC 6750 §3.1: a request with no credentials gets no error code.
    challenge = f'Bearer error="{error}"' if error else "Bearer"
    return JSONResponse(
        {"error": error or "unauthorized"},
        status_code=401,
        headers={"WWW-Authenticate": challenge},
    )
