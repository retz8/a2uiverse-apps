"""The fake sign-in: the kit's one upstream sign-in, over the app's fake accounts.

Its page is an account chooser with no consent of its own — the authority tile is the
consent — shown even with one account, in the customer's words (task-12.9 decision 11).
"""

from __future__ import annotations

from collections.abc import Sequence
from html import escape

from starlette.requests import Request
from starlette.responses import HTMLResponse, Response

from a2ui_agent_kit.sign_in import FakeAccount, PendingSignIn, UpstreamAccount

_STYLE = """
:root { color-scheme: light dark; --ink: #1c2024; --soft: #60646c; --line: #d9d9e0;
  --page: #f9f9fb; --card: #fff; --press: #f0f0f3; }
@media (prefers-color-scheme: dark) { :root { --ink: #edeef0; --soft: #b0b4ba;
  --line: #363a3f; --page: #111113; --card: #18191b; --press: #212225; } }
* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px;
  background: var(--page); color: var(--ink);
  font: 15px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; }
main { width: 100%; max-width: 380px; background: var(--card); border: 1px solid var(--line);
  border-radius: 12px; padding: 24px; }
h1 { font-size: 20px; margin: 0 0 4px; }
p { margin: 0 0 20px; color: var(--soft); }
form { display: grid; gap: 8px; margin: 0; }
button { display: grid; gap: 2px; width: 100%; text-align: left; font: inherit;
  color: inherit; background: none; border: 1px solid var(--line); border-radius: 8px;
  padding: 12px 14px; cursor: pointer; }
button:hover, button:focus-visible { background: var(--press); }
button span { color: var(--soft); font-size: 13px; }
"""


def page(title: str, body: str, status: int = 200) -> HTMLResponse:
    html = (
        "<!doctype html><html lang=en><head><meta charset=utf-8>"
        '<meta name=viewport content="width=device-width, initial-scale=1">'
        f"<title>{escape(title)}</title><style>{_STYLE}</style></head>"
        f"<body><main>{body}</main></body></html>"
    )
    # Sign-in runs in a window of its own, never in a frame (phase-12 decision 14).
    headers = {
        "Cache-Control": "no-store",
        "X-Frame-Options": "DENY",
        "Content-Security-Policy": "frame-ancestors 'none'",
    }
    return HTMLResponse(html, status_code=status, headers=headers)


def message_page(heading: str, line: str, status: int = 400) -> HTMLResponse:
    return page(heading, f"<h1>{escape(heading)}</h1><p>{escape(line)}</p>", status)


def _label(account: FakeAccount) -> tuple[str, str]:
    claims = account.claims
    first = claims.get("name") or claims.get("email") or claims.get("preferred_username")
    second = claims.get("email") or claims.get("preferred_username") or ""
    return first or account.id, second if second != first else ""


class FakeAccountChooser:
    """Signs in as one of the app's fake accounts, chosen on a page of its own."""

    def __init__(self, accounts: Sequence[FakeAccount], app_name: str):
        self._accounts = {a.id: a for a in accounts}
        self._app_name = app_name

    def account(self, account_id: str) -> UpstreamAccount | None:
        found = self._accounts.get(account_id)
        return UpstreamAccount(found.id, dict(found.claims)) if found else None

    async def start(self, request: Request, pending: PendingSignIn) -> Response:
        rows = []
        for account in self._accounts.values():
            first, second = _label(account)
            rows.append(
                f'<button type=submit name=account value="{escape(account.id)}">'
                f"{escape(first)}{f'<span>{escape(second)}</span>' if second else ''}"
                "</button>"
            )
        body = (
            "<h1>Choose an account</h1>"
            f"<p>to continue to {escape(self._app_name)}</p>"
            f'<form method=post action="{escape(pending.finish_url)}">'
            f'<input type=hidden name=pending value="{escape(pending.id)}">'
            f"{''.join(rows)}</form>"
        )
        return page("Choose an account", body)

    async def finish(self, request: Request) -> tuple[str, UpstreamAccount]:
        form = await request.form()
        account = self.account(str(form.get("account", "")))
        if account is None:
            raise ValueError("no such account")
        return str(form.get("pending", "")), account
