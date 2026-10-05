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

Flags: `--mode`, `--port`, `--host`, and `--base-url`, the address the agent card advertises. With sign-in on, `--state-dir` moves the sign-in store and `--access-token-lifetime` shortens the tokens the agent issues, for exercising refresh in development. `MODEL_NAME` picks the model; it defaults to `gemini-3.7-flash`.

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

Deterministic and stub mode sign in with the fake accounts on a chooser page. Adding `fake_account=<id>` to the sign-in address skips the chooser, for recordings and tests; this works in deterministic mode only. Live mode signs in through `upstream`, an `UpstreamSignIn` the app provides: it sends the browser to the vendor's sign-in and hands back the account and the vendor's token. It can also revoke the vendor's token when the account's last sign-in ends.

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
| `google_adc`                          | Optional: sign in to a Google MCP server with Application Default Credentials                       |
| `paint_meta`                          | Optional: a short title per painted surface, and a mark on a surface that asks something            |
| `sign_in`, `sign_in_server`           | Optional: the app's sign-in, the OAuth authorization server it serves and the 401 on A2A requests   |
| `sign_in_store`, `sign_in_fake`       | The owner-only store behind sign-in, and the chooser over the fake accounts                         |
| `testing`                             | Runs an executor in-process, for an app's own tests                                                 |

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
