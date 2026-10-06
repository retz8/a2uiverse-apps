# a2ui-agent-kit

A Python kit for building A2A agents that answer with UI they generate in A2UI. It carries everything the apps in this repo share: the A2A server, the three run modes, catalog loading and validation, prompt assembly and recording. Each app keeps only what is its own: its card, prompt prose, tools, fixtures and knowledge docs.

An agent built on it speaks A2UI and A2A and nothing else. Unofficial: not part of the A2UI project.

## Using it

An app hands the kit one `AgentAppConfig` and calls `run`:

```python
# app/__main__.py
from a2ui_agent_kit.cli import run

from app.config import CONFIG

run(CONFIG)
```

```python
# app/config.py, abridged
CONFIG = AgentAppConfig(
    name=APP_NAME,
    skills=SKILLS,                            # the agent card's skills
    default_port=11005,
    catalog_path=CATALOG_JSON,                # the app's A2UI catalog
    catalog_kind="basic",                     # or "custom"
    role_description=prose.ROLE_DESCRIPTION,  # who the agent is
    domain_knowledge_path=DOMAIN_DOC,         # what the model should know about the product
    build_response=build_response,            # deterministic mode: an action to canned A2UI
    build_text_response=build_text_response,  # deterministic mode: a question to canned A2UI
    stub_tools=STUB_TOOLS,                    # stub mode: tools over canned data
    live_toolset_factory=live_toolset,        # live mode: the MCP server
    ...
)
```

[`src/a2ui_agent_kit/config.py`](src/a2ui_agent_kit/config.py) lists every field. [`create-a2ui-agent`](../create-a2ui-agent/) scaffolds a whole app with this already filled in.

Then every app runs the same way:

```bash
uv run python -m app --mode deterministic   # canned answers, no model
uv run python -m app --mode stub            # the model over canned data
uv run python -m app --mode live            # the model over the real MCP server
```

Flags: `--mode`, `--port`, `--host`, and `--base-url`, the address the agent card advertises. With sign-in on, `--public-url` is the address the browser reaches the sign-in pages at — the sign-in page, the account chooser's form and the finish address — while the card's endpoint, the sign-in metadata and the token endpoint stay on `--base-url`, which it defaults to; `--state-dir` moves the sign-in store and `--access-token-lifetime` shortens the tokens the agent issues, for exercising refresh in development. `MODEL_NAME` picks the model; it defaults to `gemini-3.7-flash`.

## Turning on sign-in

An app that needs its user signed in puts a `SignIn` on its config. The agent becomes its own sign-in front door: an OAuth authorization server that the client signs in against, with its card declaring it. The client never sees the vendor's token. The agent keeps the vendor's token and hands the client a token of its own.

```python
from a2ui_agent_kit.sign_in import FakeAccount, SignIn

SIGN_IN = SignIn(
    # Every scope the app has, in words its user reads when asked to sign in.
    scopes={
        "issues.read": "See your issues",
        "issues.write": "Comment on and close your issues",
    },
    first_sign_in_scopes=["issues.read"],          # what the first sign-in asks for
    action_scopes={"close_issue": ["issues.write"]},  # deterministic mode: action -> scopes
    tool_scopes={"update_issue": ["issues.write"]},   # stub and live mode: tool -> scopes
    fake_accounts=[FakeAccount("ada", {"email": "ada@example.com", "name": "Ada"})],
    upstream=VENDOR_SIGN_IN,                       # live mode: the vendor's sign-in
)

CONFIG = AgentAppConfig(..., sign_in=SIGN_IN)
```

With it on:

- The card declares one `oauth2` scheme, `signIn`, with the authorization-code flow, the `scopes` map and its metadata address. Its `security` is the first sign-in's scopes.
- The agent serves its authorization server next to A2A:
  - metadata at `/.well-known/oauth-authorization-server`;
  - sign-in at `/oauth/authorize`, with S256 PKCE required;
  - the token endpoint, with refresh tokens that rotate on every use;
  - registration, by a client ID metadata document or dynamic registration;
  - revocation;
  - an OpenID Connect ID token signed ES256, carrying a stable `sub` and the account's `email`, `preferred_username` and `name`.
- An A2A request without a live token the agent issued is answered 401.
- Inside a request, `current_account()` is the signed-in account. In deterministic mode the app's answer code reads it to answer from that account's data.
- An action or tool that needs a scope the token lacks ends the run in A2A's `auth-required` state, naming the missing scopes. A cut-off LLM run is kept out of the conversation history. After the user signs in with more access, the client sends the request again.
- In live mode the `live_toolset_factory` is called with the account, once per account, so each account's MCP connection carries its own vendor token.

Deterministic and stub mode sign in with the fake accounts on a chooser page. Adding `fake_account=<id>` to the sign-in address skips the chooser, for recordings and tests; this works in deterministic and stub mode, never live. Live mode signs in through `upstream`, an `UpstreamSignIn` the app provides: it sends the browser to the vendor's sign-in and hands back the account and the vendor's token. It can also refresh the vendor's token before a request, and revoke it when the account's last sign-in ends.

When fake accounts each have their own data, the app keeps a subdirectory per fake-account id in each fixtures directory — `fixtures/deterministic/<id>/` and `fixtures/stub/<id>/` — and `fixture_responder` and `stub_fixture_loader` read the signed-in account's. An app with one set keeps it flat. `testing.signed_in_as(sign_in, id)` binds a fake account for answer code called directly in a test.

The beat driver signs in to an agent whose card asks sign-in, asking for every scope on the card. `--account <id>` signs in as that fake account through `fake_account=<id>`. Without it, the driver opens the agent's sign-in page in the browser and catches the return on a `localhost` address (RFC 8252): the vendor's sign-in in live mode, the chooser otherwise. An agent signing in with a key takes `--api-key`. An app recording each account's beats apart passes `per_account=True` to `beats.main`, and the beats land in `recordings/beats/<id>/`.

### Signing in with the vendor's OAuth

For a vendor that signs in with OAuth, `VendorOAuth` is the upstream, configured per vendor:

```python
from a2ui_agent_kit.sign_in_vendor import ClientFromEnv, VendorOAuth

VENDOR_SIGN_IN = VendorOAuth(
    vendor="Acme",
    scopes={"issues.read": ["read"], "issues.write": ["write"]},  # your scope -> the vendor's
    identity_scopes=["openid", "email"],      # asked on every sign-in, for `identify`
    identify=identify,                         # async (token, http) -> (account id, claims)
    metadata_url="https://acme.example/.well-known/oauth-authorization-server",
)
```

- **The vendor client.** With `client=ClientFromEnv("ACME_CLIENT_ID", "ACME_CLIENT_SECRET")` it signs in with a client you registered at the vendor, read from `.env`. Without it, the agent registers itself by dynamic registration on the first sign-in and keeps the registration in its store.
- **The return address** registered at the vendor is the agent's finish address, `<public URL>/sign-in/finish` — `--public-url`, otherwise `--base-url`. Register one for each address the agent runs at.
- **Scopes.** The vendor is asked for what the sign-in's scopes need, plus what the account already granted on a request for more access. A vendor granting less than asked doesn't sign in.
- **Who signed in.** `identify` gets the vendor's token response and returns the vendor's stable id for the account and its display claims. `id_token_claims` reads an ID token straight from the vendor's token endpoint.
- **The vendor's token** is refreshed before a request when it's within five minutes of expiring. When it can't be refreshed, or the vendor answers 401, the run fails and the account's sign-ins end, so A2UIVerse asks the person to sign in again.
- **Revocation** is RFC 7009 at the vendor's revocation endpoint, or `revoke=` for a vendor that revokes its own way.

A live toolset passes `header_provider=account_bearer` (from `a2ui_agent_kit.toolset`), so each MCP call carries the account's current token.

### Signing in with a key

An app that signs in with an API key instead puts an `ApiKeySignIn` on its config:

```python
from a2ui_agent_kit.sign_in import ApiKeySignIn, FakeAccount

SIGN_IN = ApiKeySignIn(
    header="X-Acme-Key",
    description="Your Acme key. You'll find it on your Acme account page.",
    keys={"demo-key": FakeAccount("demo", {"name": "Demo user"})},
)
```

The card declares one `apiKey` scheme in that header, with the description in your customer's words. A request without one of the keys is answered 401, and `current_account()` is the key's account. There are no sign-in routes and no request for more access.

The store holds the issued tokens (by hash), the registered clients, the accounts and the signing key. It is an owner-only file in `<app>/.state/`, which git ignores.

## What's in it

| Module                                | What it does                                                                                        |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `cli`, `server`, `modes`              | The entrypoint, the A2A server with one agent card for every mode, and the executor per mode        |
| `executor_llm`                        | Streams the model's A2UI as it's written, validates it against the catalog at the end, and retries  |
| `executor_deterministic`, `responses` | Deterministic mode: canned A2UI per action or question, from the app's fixtures, titled as recorded |
| `catalog`, `prompt`, `knowledge`      | Loads the app's catalog, validates surfaces against it, and assembles the system prompt             |
| `toolset`, `tool_shaping`             | A hook on every MCP call, to change its arguments on the way out or its result on the way back      |
| `recorder`, `corpus`, `beats`         | Recording: what the agent painted and what the MCP server returned, and scripted conversations      |
| `paint_meta`                          | Optional: a short title per painted surface, and a mark on a surface that asks something            |
| `sign_in`, `sign_in_server`           | Optional: the app's sign-in, the OAuth authorization server it serves and the 401 on A2A requests   |
| `sign_in_store`, `sign_in_fake`       | The owner-only store behind sign-in, and the chooser over the fake accounts                         |
| `sign_in_vendor`                      | Optional: live sign-in with a vendor's OAuth, as the upstream sign-in                               |
| `testing`                             | Runs an executor in-process, or the agent on a port signed in as a vault would, for an app's tests  |

## Depending on it

Apps in this repo take it as an editable path dependency, so they always run on the kit as it is:

```toml
[tool.uv.sources]
a2ui-agent-kit = { path = "../../agent-kit", editable = true }
```

An app anywhere else pins it to a commit:

```toml
[tool.uv.sources]
a2ui-agent-kit = { git = "https://github.com/retz8/a2uiverse-apps", subdirectory = "agent-kit", rev = "<sha>" }
```

## Test

```bash
uv sync
uv run pytest
```

No model calls and no credentials needed. The scaffolder's own tests also run a freshly scaffolded app against this checkout of the kit, so a change here that breaks new apps fails there.

## Connecting to A2UIVerse

[A2UIVerse](https://github.com/retz8/a2uiverse)'s launcher starts an agent through this same entrypoint, passing the port from its roster. `paint_meta` is the part A2UIVerse's canvas reads: the paint titles and question marks ride beside the A2UI, and any other client ignores them.
