"""One credential check over every A2A call, on all six paths (a2uiverse task-20.9 decision 10).

An app with sign-in has each A2A call carry its credential: the bearer token the kit's sign-in
issued, or one of the app's keys. The check reads it from the HTTP header the card's scheme
names on the four HTTP paths and from the metadata entry under that header's name in lowercase
on the two gRPC ones. A call without a good one is refused for sign-in, HTTP 401 on JSON-RPC and
HTTP+JSON and the gRPC status `UNAUTHENTICATED` on gRPC (a2uiverse task-20.5 decision 8). The
extended card's call is an A2A call like any other. The card, the sign-in routes and the card's
key set stay open.

The signed-in account rides the call context the executor reads, under `auth`, and names the
call's owner, so a task is the same account's on every path.
"""

from __future__ import annotations

import contextvars
import dataclasses
import functools
import hmac
import inspect
from typing import Protocol

import grpc
from a2a.auth.user import User
from a2a.server.context import ServerCallContext
from a2a.server.request_handlers import DefaultGrpcServerCallContextBuilder
from starlette.datastructures import Headers
from starlette.responses import JSONResponse, Response

from a2ui_agent_kit.bindings import grpc_metadata_key
from a2ui_agent_kit.sign_in import ApiKeySignIn, SignedInAccount


class Refused(Exception):
    """A call without a good credential; `error` is RFC 6750's code, None for no credential."""

    def __init__(self, error: str | None = None):
        self.error = error
        super().__init__(error or "sign-in required")


class Credentials(Protocol):
    """How an app's calls prove who they are."""

    # The HTTP header the credential rides in.
    header: str

    async def account(self, value: str | None) -> SignedInAccount:
        """The account `value` signs in; raises `Refused`."""
        ...

    def http_refusal(self, refused: Refused) -> Response: ...


class BearerCredentials:
    """A live bearer token the kit's sign-in issued (RFC 6750)."""

    header = "authorization"

    def __init__(self, sign_in):  # SignInServer; untyped to keep the import one-way
        self._sign_in = sign_in

    async def account(self, value: str | None) -> SignedInAccount:
        scheme, _, token = (value or "").partition(" ")
        if scheme.lower() != "bearer" or not token.strip():
            raise Refused()
        account = self._sign_in.store.signed_in(token.strip(), self._sign_in.kind)
        if account is not None:
            account = await self._sign_in.fresh(account)
        if account is None:
            raise Refused("invalid_token")
        return dataclasses.replace(
            account, end_sign_ins=functools.partial(self._sign_in.end_account, account.sub)
        )

    def http_refusal(self, refused: Refused) -> Response:
        # RFC 6750 §3.1: a request with no credentials gets no error code.
        challenge = f'Bearer error="{refused.error}"' if refused.error else "Bearer"
        return JSONResponse(
            {"error": refused.error or "unauthorized"},
            status_code=401,
            headers={"WWW-Authenticate": challenge},
        )


class KeyCredentials:
    """One of the app's keys, in the header its `apiKey` scheme names."""

    def __init__(self, sign_in: ApiKeySignIn):
        self._sign_in = sign_in
        self.header = sign_in.header

    async def account(self, value: str | None) -> SignedInAccount:
        key = (value or "").strip()
        for valid, account in self._sign_in.keys.items() if key else ():
            if hmac.compare_digest(valid.encode(), key.encode()):
                return SignedInAccount(
                    sub=account.id,
                    account_id=account.id,
                    claims=dict(account.claims),
                    scopes=frozenset(),
                )
        raise Refused()

    def http_refusal(self, refused: Refused) -> Response:
        return JSONResponse({"error": "unauthorized"}, status_code=401)


class _Principal:
    """The Starlette user the SDK's call context reads; its name is the call's owner."""

    is_authenticated = True

    def __init__(self, sub: str):
        self.display_name = sub
        self.identity = sub


class HttpGate:
    """The check on the four HTTP paths: JSON-RPC's `POST` at `rpc_path`, and every route
    under `rest_prefix`, where HTTP+JSON answers both A2A versions."""

    def __init__(self, app, credentials: Credentials, rpc_path: str, rest_prefix: str):
        self.app = app
        self._credentials = credentials
        self._rpc_path = rpc_path
        self._rest_prefix = rest_prefix

    def _is_a2a_call(self, scope) -> bool:
        path, method = scope["path"], scope["method"]
        if path == self._rpc_path:
            return method == "POST"
        under_rest = path == self._rest_prefix or path.startswith(f"{self._rest_prefix}/")
        return under_rest and method != "OPTIONS"

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http" and self._is_a2a_call(scope):
            value = Headers(scope=scope).get(self._credentials.header)
            try:
                account = await self._credentials.account(value)
            except Refused as refused:
                return await self._credentials.http_refusal(refused)(scope, receive, send)
            scope["user"] = _Principal(account.sub)
            scope["auth"] = account
        await self.app(scope, receive, send)


# The account the running gRPC call signed in, from the gate to the call context's builder,
# both inside the call's own task.
_grpc_account: contextvars.ContextVar[SignedInAccount | None] = contextvars.ContextVar(
    "a2ui_agent_kit_grpc_account", default=None
)


class GrpcGate(grpc.aio.ServerInterceptor):
    """The check on the two gRPC paths: every method of both A2A services."""

    def __init__(self, credentials: Credentials):
        key = grpc_metadata_key(credentials.header)
        if key is None:  # the config refuses such a header before the app starts
            raise ValueError(f"the header {credentials.header!r} cannot ride on gRPC")
        self._credentials = credentials
        self._key = key

    async def _sign_in(self, context: grpc.aio.ServicerContext) -> None:
        value = next(
            (v for k, v in context.invocation_metadata() or () if k == self._key), None
        )
        try:
            account = await self._credentials.account(value)
        except Refused as refused:
            await context.abort(grpc.StatusCode.UNAUTHENTICATED, str(refused))
        _grpc_account.set(account)

    async def intercept_service(self, continuation, handler_call_details):
        handler = await continuation(handler_call_details)
        if handler is None:
            return None
        if handler.unary_unary is not None:
            return grpc.unary_unary_rpc_method_handler(
                self._unary(handler.unary_unary),
                request_deserializer=handler.request_deserializer,
                response_serializer=handler.response_serializer,
            )
        if handler.unary_stream is not None:
            return grpc.unary_stream_rpc_method_handler(
                self._stream(handler.unary_stream),
                request_deserializer=handler.request_deserializer,
                response_serializer=handler.response_serializer,
            )
        return handler  # A2A has no client-streaming method

    def _unary(self, behavior):
        async def checked(request, context):
            await self._sign_in(context)
            return await behavior(request, context)

        return checked

    def _stream(self, behavior):
        if inspect.isasyncgenfunction(behavior):

            async def checked_generator(request, context):
                await self._sign_in(context)
                async for response in behavior(request, context):
                    yield response

            return checked_generator

        async def checked(request, context):
            await self._sign_in(context)
            return await behavior(request, context)

        return checked


class _GrpcUser(User):
    def __init__(self, sub: str):
        self._sub = sub

    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def user_name(self) -> str:
        return self._sub


class GrpcAccountContextBuilder(DefaultGrpcServerCallContextBuilder):
    """The SDK's gRPC call context, with the account the gate signed in under `auth` and as
    the call's user, as the SDK's HTTP context builder has them."""

    def build(self, context: grpc.aio.ServicerContext) -> ServerCallContext:
        call_context = super().build(context)
        account = _grpc_account.get()
        if account is not None:
            call_context.state["auth"] = account
            call_context.user = _GrpcUser(account.sub)
        return call_context
