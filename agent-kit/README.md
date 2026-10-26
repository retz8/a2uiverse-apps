# a2ui-agent-kit

A Python kit for building A2A agents that answer with UI they generate in A2UI. It carries everything the apps in this repo share — the A2A server, the three run modes, sign-in, catalog loading and validation, prompt assembly and recording — so an app keeps only what is its own: its card, prompt prose, tools, fixtures and knowledge docs. An agent built on it speaks A2UI and A2A and nothing else. Unofficial: not part of the A2UI project.

## Install

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

Either way it brings A2UI's Python packages at exact pins: `a2ui-agent-sdk` 0.9.0, `a2ui-core` 0.4.0 and `a2ui-a2a` 0.1.0.

[`create-a2ui-agent`](../create-a2ui-agent/) scaffolds a whole app with the config below already filled in, `provider` and `documentation_url` aside.

## Quick start

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
    version="0.1.0",                         # the agent card's version
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
    provider=AgentProvider(organization="Linear", url="https://linear.app"),  # the vendor it fronts
    documentation_url=HELP_PAGE,              # the app's help page
    old_catalog_line=None,                    # an old catalog id kept beside this one (below)
    ...
)
```

Then every app runs the same way:

```bash
uv run python -m app --mode deterministic   # canned answers, no model
uv run python -m app --mode stub            # the model over canned data
uv run python -m app --mode live            # the model over the real MCP server
```

| Flag or variable          | What it does                                                                                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--mode`                  | `deterministic`, `stub` or `live`                                                                                                                                     |
| `--port`, `--host`        | Where the agent listens                                                                                                                                               |
| `--base-url`              | The address the agent card advertises; the card's endpoint, the sign-in metadata and the token endpoint stay here                                                     |
| `--public-url`            | With sign-in on, the address the browser reaches the sign-in pages at — the sign-in page, the account chooser's form and the finish address; defaults to `--base-url` |
| `--state-dir`             | Moves the sign-in store, an owner-only file in `<app>/.state/` by default, which git ignores                                                                          |
| `--access-token-lifetime` | Shortens the tokens the agent issues, for exercising refresh in development                                                                                           |
| `MODEL_NAME`              | The model; `gemini-3.8-flash` by default. A Gemini name as ADK takes it, with `GOOGLE_API_KEY`; a Claude model as `anthropic/<model>`, with `ANTHROPIC_API_KEY`         |
| `MODEL_EFFORT`            | The thinking tier: `low` spends no thinking, `default` leaves the model's own; `default` by default                                                                    |

`version` is the agent card's version, the app's: when the card changes, it moves to one the app has never published, or the marketplace refuses the publish. `provider` and `documentation_url` go on the card too — where a person finishes on the app's own side, such as A2UIVerse's "Continue on" link and the help link on its key page. [`src/a2ui_agent_kit/config.py`](src/a2ui_agent_kit/config.py) lists every field.

## Sign-in

An app that needs its user signed in puts a `SignIn` on its config. The agent becomes its own sign-in front door — an OAuth authorization server the client signs in against, declared on its card. The agent keeps the vendor's token and hands the client a token of its own; the client never sees the vendor's.

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

- **The card** declares one `oauth2` scheme, `signIn`, with the authorization-code flow, the `scopes` map and its metadata address; its `security` is the first sign-in's scopes.
- **The agent serves its authorization server** next to A2A: metadata at `/.well-known/oauth-authorization-server`; sign-in at `/oauth/authorize`, S256 PKCE required; the token endpoint, with refresh tokens that rotate on every use; registration, by a client ID metadata document or dynamic registration; revocation; and an OpenID Connect ID token signed ES256, carrying a stable `sub` and the account's `email`, `preferred_username` and `name`. A `login_hint` naming an account the agent holds binds the sign-in to that account, asked again for what it already granted beside the new scopes.
- **Requests.** An A2A request without a live token the agent issued is answered 401. Inside a request, `current_account()` is the signed-in account; in deterministic mode the app's answer code reads it to answer from that account's data. An action or tool that needs a scope the token lacks ends the run in A2A's `auth-required`, naming the missing scopes — a cut-off LLM run kept out of the conversation history — and the client sends the request again once the user has signed in with more access. In live mode `live_toolset_factory` is called with the account, once per account, so each account's MCP connection carries its own vendor token.
- **Fake accounts.** Deterministic and stub mode sign in with the fake accounts on a chooser page; `fake_account=<id>` on the sign-in address skips the chooser, for recordings and tests, never in live mode. When fake accounts each have their own data, the app keeps a subdirectory per id in each fixtures directory — `fixtures/deterministic/<id>/`, `fixtures/stub/<id>/` — and `fixture_responder` and `stub_fixture_loader` read the signed-in account's; an app with one set keeps it flat. `testing.signed_in_as(sign_in, id)` binds a fake account for answer code called directly in a test.
- **The beat driver** signs in to an agent whose card asks sign-in, for every scope on the card: `--account <id>` as that fake account; without it, the agent's sign-in page opens in the browser and the return is caught on a `localhost` address (RFC 8252) — the vendor's sign-in in live mode, the chooser otherwise. An agent signing in with a key takes `--api-key`. `per_account=True` on `beats.main` records each account's beats apart, in `recordings/beats/<id>/`.

The store behind sign-in holds the issued tokens (by hash), the registered clients, the accounts and the signing key, in the owner-only file `--state-dir` places.

### With the vendor's OAuth

Live mode signs in through `upstream`, an `UpstreamSignIn` that sends the browser to the vendor's sign-in and hands back the account and the vendor's token, refreshes it before a request, and revokes it when the account's last sign-in ends. For a vendor that signs in with OAuth, `VendorOAuth` is the upstream:

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

- **The vendor client.** `client=ClientFromEnv("ACME_CLIENT_ID", "ACME_CLIENT_SECRET")` signs in with a client you registered at the vendor, read from `.env`; without it, the agent registers itself by dynamic registration on the first sign-in and keeps the registration in its store.
- **The return address** registered at the vendor is the agent's finish address, `<public URL>/sign-in/finish` — `--public-url`, otherwise `--base-url`. Register one for each address the agent runs at.
- **Scopes.** The vendor is asked for what the sign-in's scopes need, plus what the account already granted on a request for more access; a vendor granting less than asked doesn't sign in.
- **Who signed in.** `identify` gets the vendor's token response and returns the vendor's stable id for the account and its display claims; `id_token_claims` reads an ID token straight from the token endpoint.
- **The vendor's token** is refreshed before a request when it's within five minutes of expiring. When it can't be, or the vendor answers 401, the run fails and the account's sign-ins end, so A2UIVerse asks the person to sign in again. Revocation is RFC 7009 at the vendor's revocation endpoint, or `revoke=` for a vendor that revokes its own way.
- **Live toolsets** pass `header_provider=account_bearer` (from `a2ui_agent_kit.toolset`), so each MCP call carries the account's current token.

### With a key

An app that signs in with an API key puts an `ApiKeySignIn` on its config instead:

```python
from a2ui_agent_kit.sign_in import ApiKeySignIn, FakeAccount

SIGN_IN = ApiKeySignIn(
    header="X-Acme-Key",
    description="Your Acme key. You'll find it on your Acme account page.",
    keys={"demo-key": FakeAccount("demo", {"name": "Demo user"})},
)
```

The card declares one `apiKey` scheme in that header, with the description in your customer's words. A request without one of the keys is answered 401, and `current_account()` is the key's account. There are no sign-in routes and no request for more access.

## Shipping a breaking catalog change

A catalog id is the catalog's version: a change that removes a component or changes a type needs a new id. Keep the old line beside the new one, and the change ships as a suggested update — installs still on the old id keep getting answers in it until they update.

```python
from a2ui_agent_kit.config import CatalogLine

OLD_LINE = CatalogLine(
    catalog_path=OLD_CATALOG_JSON,               # a copy of the old catalog.json, as published
    catalog_kind="basic",
    examples_dir=OLD_EXAMPLES,
    brand_guidance_path=OLD_BRAND_DOC,
    question_policy=require_carries_action,
    build_response=old_build_response,           # deterministic mode, in the old catalog
    build_text_response=old_build_text_response,
)

CONFIG = AgentAppConfig(..., catalog_path=NEW_CATALOG_JSON, old_catalog_line=OLD_LINE)
```

1. Move everything that names the old catalog's components into `OLD_LINE`, as it was: its catalog, examples, brand doc, question policy and deterministic answers.
2. Point the config's own catalog fields at the new catalog. Prose, tools and sign-in stay shared.
3. Move `version` in `app/config.py`: the card changes, and the marketplace refuses a changed card at a version it has already published. Pack and publish the new catalog as usual; the marketplace already holds the old one.
4. To retire the old id, delete `old_catalog_line` and publish.

With an old line:

- The card names both ids, newest first. The kit won't start if both are the same id.
- A turn is painted in the newest id the client renders, or the newest when the client sends no capabilities.
- An action is answered in the id of the surface it came from. If the client no longer renders that id, the answer is a new surface in the newest one; in deterministic mode, the line's answers stand as written. The kit knows a surface's id only from the `createSurface` it sent since it last started: an action on an older surface takes the newest line.
- A client that renders neither id gets no UI, only "<App name> has changed and can't show this here."

## Previewing for the marketplace

The marketplace can't sign in to an app, so for an app whose card asks sign-in, Stellify's `preview` asks your running agent its first screen on your machine, with a token you give it in `STELLIFY_CREDENTIAL`. `preview_credential` gets that token: it signs in as one of the agent's fake accounts, for what the card asks at a first sign-in, and prints the token alone, every other line going to stderr.

```bash
cd linear/agent
uv run python -m app --mode deterministic   # in one terminal
export STELLIFY_CREDENTIAL=$(uv run python -m a2ui_agent_kit.preview_credential --url http://localhost:11005 --account me)
```

`--url` is the agent's address or its card's; `--account` one of the fake accounts the agent's README lists. The fake accounts sign in only in `deterministic` and `stub` mode: an agent running `live` is previewed from a `deterministic` or `stub` run of the same checkout, whose card is the same, so the preview is at the version the live card carries. It prints nothing on stdout and exits 1 when the agent runs `live` (preview from a `deterministic` or `stub` run), when the app signs in with a key (set `STELLIFY_CREDENTIAL` to the key), or when the app asks no sign-in (preview it without a credential).

## What's in it

| Module                                | What it does                                                                                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `cli`, `server`, `modes`              | The entrypoint, the A2A server with one agent card for every mode, and the executor per mode                                        |
| `executor_llm`                        | Streams the model's A2UI as it's written, validates it against the catalog at the end, sends what the stream held back, and retries |
| `executor_deterministic`, `responses` | Deterministic mode: canned A2UI per action or question, from the app's fixtures, titled as recorded                                 |
| `catalog`, `prompt`, `knowledge`      | Loads the app's catalog, validates surfaces against it, and assembles the system prompt                                             |
| `catalog_lines`                       | Optional: an old catalog id beside the current one, and the id each turn is painted in                                              |
| `toolset`, `tool_shaping`             | A hook on every MCP call, to change its arguments on the way out or its result on the way back                                      |
| `recorder`, `corpus`, `beats`         | Recording: what the agent painted and what the MCP server returned, and scripted conversations                                      |
| `paint_meta`                          | Optional: a short title per painted surface, and a mark on a surface that asks something                                            |
| `sign_in`, `sign_in_server`           | Optional: the app's sign-in, the OAuth authorization server it serves and the 401 on A2A requests                                   |
| `sign_in_store`, `sign_in_fake`       | The owner-only store behind sign-in, and the chooser over the fake accounts                                                         |
| `sign_in_vendor`                      | Optional: live sign-in with a vendor's OAuth, as the upstream sign-in                                                               |
| `testing`                             | Runs an executor in-process, or the agent on a port signed in as a vault would, for an app's tests                                  |
| `preview_credential`                  | A token from your running agent for Stellify's `preview`, signed in as one of its fake accounts                                     |
| `upstream_patches`                    | Local fixes over the pinned A2UI releases, applied at import, each until a release carries it                                       |

The system prompt puts three rules every app shares ahead of the app's own workflow: a failure reported in prose is worded for a person who may not work in tech, with no status code, tool name, URL or sign-in term; a write drafted for the person to confirm is a proposal, never declared a question, and one dismissed outright is repainted settled; and the person's time zone is passed to every tool that takes one, a time from a tool that takes none is shown with its zone named, and no time is converted by the model.

`paint_meta` is the part A2UIVerse's canvas reads: the paint titles and question marks ride beside the A2UI, and any other client ignores them. A2UIVerse's launcher starts an agent through this same entrypoint, passing `--host localhost` and the port from its roster, `--public-url` when `A2UIVERSE_PUBLIC_URL` is set, and `--state-dir` under its `--agent-state`.

## Developing the kit

```bash
uv sync
uv run pytest
```

No model calls and no credentials needed. The scaffolder's own tests also run a freshly scaffolded app against this checkout of the kit, so a change here that breaks new apps fails there.

## Further reading

- [`docs/design/agent-kit.md`](https://github.com/retz8/a2uiverse/blob/main/docs/design/agent-kit.md) in the platform repo — the kit end to end.
- [`docs/design/authority.md`](https://github.com/retz8/a2uiverse/blob/main/docs/design/authority.md) — how A2UIVerse signs in to an agent built on it.
