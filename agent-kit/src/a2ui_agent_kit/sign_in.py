"""Sign-in: the app's side of the kit's sign-in front door (task-12.9).

An app turns sign-in on by putting a `SignIn` on its config: the scopes it declares,
in its customer's words; the scopes the first sign-in asks for; which actions and tools
need which scopes; its deterministic fake accounts; and, for live mode, its upstream
sign-in — the seam through which the vendor's own sign-in hands the agent an account.
The kit then serves an OAuth authorization server the AuthVault signs in against
(`sign_in_server`), writes the card's `securitySchemes` and `security`, and refuses an
A2A request without a token it issued.

Inside a request, `current_account()` is the signed-in account the request's token
stands for — its stable `sub`, its display claims, the scopes it granted and, in live
mode, its vendor token. A missing scope raises `AuthRequired`, which ends the run with
A2A's `auth-required` naming the missing keys (task-12.2 decision 12).
"""

from __future__ import annotations

import contextvars
from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any, Protocol, runtime_checkable

from a2a.types import DataPart, Message, Part, TextPart
from a2a.utils import new_agent_parts_message

if TYPE_CHECKING:
    from a2a.server.agent_execution import RequestContext
    from starlette.requests import Request
    from starlette.responses import Response

# The key of the one scheme on the card. Only the vault reads it, and an
# `auth-required` request names it.
SCHEME_KEY = "signIn"

# OpenID Connect's own scope: advertised by the server, never a scope of the app's.
OPENID_SCOPE = "openid"


@dataclass(frozen=True)
class FakeAccount:
    """A deterministic account the fake sign-in offers: an id and its display claims
    (`email`, `preferred_username`, `name` — whichever it has)."""

    id: str
    claims: Mapping[str, str]


@dataclass(frozen=True)
class UpstreamAccount:
    """What an upstream sign-in hands back: the vendor's stable id for the account, its
    display claims, and the vendor's token (None where there is no vendor)."""

    id: str
    claims: Mapping[str, str]
    vendor_token: Mapping[str, Any] | None = None


@dataclass(frozen=True)
class PendingSignIn:
    """A sign-in waiting on its upstream. `account_id` is set when the vault bound the
    sign-in to one account (`login_hint`): the upstream must come back with it."""

    id: str
    scopes: tuple[str, ...]
    account_id: str | None
    finish_url: str


@runtime_checkable
class UpstreamSignIn(Protocol):
    """The seam between the kit's sign-in and the vendor's.

    `start` answers the browser on the kit's sign-in page — a page of its own, or a
    redirect to the vendor — and whatever it sends the browser to ends at the kit's
    finish URL, where `finish` returns the pending sign-in's id and the account.
    An upstream that can revoke a vendor token also has `revoke(vendor_token)`, called
    when an account's last sign-in ends.
    """

    async def start(self, request: Request, pending: PendingSignIn) -> Response: ...

    async def finish(self, request: Request) -> tuple[str, UpstreamAccount]: ...


@dataclass(frozen=True)
class SignIn:
    """An app's sign-in. Its presence on the config turns the kit's sign-in on."""

    # Scope key -> its words, shown on the authority tile under "<App> will be able
    # to" — plain customer language.
    scopes: Mapping[str, str]
    # What the first sign-in asks for: the card's `security` requirement.
    first_sign_in_scopes: Sequence[str]
    # The deterministic accounts; deterministic and stub mode sign in with these.
    fake_accounts: Sequence[FakeAccount]
    # Action name (deterministic) and tool name (LLM) -> the scopes it needs.
    action_scopes: Mapping[str, Sequence[str]] = field(default_factory=dict)
    tool_scopes: Mapping[str, Sequence[str]] = field(default_factory=dict)
    # Live mode's sign-in with the vendor.
    upstream: UpstreamSignIn | None = None

    def __post_init__(self) -> None:
        if OPENID_SCOPE in self.scopes:
            raise ValueError(f"'{OPENID_SCOPE}' is the server's own scope, not the app's.")
        declared = set(self.scopes)
        named = {
            "first_sign_in_scopes": set(self.first_sign_in_scopes),
            **{f"action_scopes[{k!r}]": set(v) for k, v in self.action_scopes.items()},
            **{f"tool_scopes[{k!r}]": set(v) for k, v in self.tool_scopes.items()},
        }
        for where, keys in named.items():
            if unknown := keys - declared:
                raise ValueError(f"{where} names undeclared scopes: {sorted(unknown)}")
        if not self.fake_accounts:
            raise ValueError("sign-in needs at least one fake account.")
        ids = [a.id for a in self.fake_accounts]
        if len(set(ids)) != len(ids):
            raise ValueError(f"fake account ids repeat: {ids}")

    def words_for(self, scopes: Sequence[str]) -> list[str]:
        return [self.scopes[s] for s in scopes]


@dataclass(frozen=True)
class SignedInAccount:
    """The account a request's token stands for."""

    sub: str
    account_id: str
    claims: Mapping[str, str]
    scopes: frozenset[str]
    vendor_token: Mapping[str, Any] | None = None


class AuthRequired(Exception):
    """A run needs scopes the token was not granted. Ends the run with `auth-required`."""

    def __init__(self, missing: Sequence[str]):
        self.missing = tuple(missing)
        super().__init__(f"sign-in needs more access: {', '.join(self.missing)}")


@dataclass(frozen=True)
class _Run:
    sign_in: SignIn
    account: SignedInAccount


_run: contextvars.ContextVar[_Run | None] = contextvars.ContextVar(
    "a2ui_agent_kit_sign_in_run", default=None
)


def current_account() -> SignedInAccount | None:
    """The signed-in account of the request being answered; None without sign-in."""
    run = _run.get()
    return run.account if run else None


def bind_account(context: RequestContext, sign_in: SignIn | None) -> contextvars.Token | None:
    """Binds the request's account for the run; the server put it on the call context."""
    if sign_in is None:
        return None
    call_context = getattr(context, "call_context", None)
    account = call_context.state.get("auth") if call_context is not None else None
    if not isinstance(account, SignedInAccount):
        return None
    return _run.set(_Run(sign_in, account))


def unbind_account(token: contextvars.Token | None) -> None:
    if token is not None:
        _run.reset(token)


def require_scopes(scopes: Sequence[str]) -> None:
    """Raises `AuthRequired` naming whichever of `scopes` the token lacks."""
    run = _run.get()
    if run is None:
        return
    if missing := [s for s in scopes if s not in run.account.scopes]:
        raise AuthRequired(missing)


def require_action_scopes(action_name: str | None) -> None:
    run = _run.get()
    if run is not None and action_name:
        require_scopes(run.sign_in.action_scopes.get(action_name, ()))


def require_tool_scopes(tool_name: str) -> None:
    run = _run.get()
    if run is not None:
        require_scopes(run.sign_in.tool_scopes.get(tool_name, ()))


def before_tool_check(*, tool, args, tool_context, **_extra):  # noqa: ANN001, ARG001
    """ADK `before_tool_callback`: a tool needing a scope the token lacks ends the run
    before it runs. Keyword-only plus `**_extra`, as ADK has grown parameters."""
    require_tool_scopes(getattr(tool, "name", str(tool)))
    return None


def auth_required_message(err: AuthRequired, context_id: str, task_id: str) -> Message:
    """The `auth-required` status message: one short line in the card's words for a
    plain A2A client, and the request in the card's own `security` shape."""
    run = _run.get()
    words = run.sign_in.words_for(err.missing) if run else list(err.missing)
    text = f"More access is needed: {'; '.join(words)}."
    parts = [
        Part(root=TextPart(text=text)),
        Part(root=DataPart(data={"security": [{SCHEME_KEY: list(err.missing)}]})),
    ]
    return new_agent_parts_message(parts, context_id, task_id)
