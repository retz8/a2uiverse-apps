# GitHub agent

An A2A agent for GitHub. It answers GitHub questions by painting A2UI surfaces with [`github-catalog`](../github-catalog/), built on Primer, GitHub's own design system. It runs on port **11001** and is built on [`a2ui-agent-kit`](../../agent-kit/).

## What it can do

In `live` mode it works through GitHub's remote MCP server, acting as the person signed in. It gets every tool the server offers, so it reads repositories, issues, pull requests and notifications, and it can comment, review, merge and edit files.

- Signing in lets it read. The first time you ask it to write, it asks for that access too.
- Writes that carry content, like a comment, a review or an edit, are shown to you as a proposal first and run only when you confirm.
- Quick toggles that are easy to undo run straight away.

> [!IMPORTANT]
> Once you allow writing, the agent can write on every repository your GitHub account reaches, under your name.

## Run

```bash
uv sync
cp .env.example .env
uv run python -m app --mode deterministic
```

| Mode            | What runs                                 | Needs                                                           |
| --------------- | ----------------------------------------- | --------------------------------------------------------------- |
| `deterministic` | canned answers, no model                  | nothing                                                         |
| `stub`          | the model over canned GitHub data         | `GOOGLE_API_KEY`                                                |
| `live`          | the model over the real GitHub MCP server | `GOOGLE_API_KEY`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |

`deterministic` answers any question with a recorded notifications digest, and answers the Primer components' demo actions with canned responses.

Other flags: `--port`, `--host`, `--base-url`, the address the agent card advertises, and `--public-url`, the address the browser reaches its sign-in pages at — a tunnel address, when the browser is on another machine. `--state-dir` moves the sign-in store from `.state/`.

## Signing in

The agent is its own sign-in: A2UIVerse signs in to it, and it signs in to GitHub. Its card asks for two scopes, in the words A2UIVerse shows when it asks you:

| Scope          | Shown as                                                       | Asked                         |
| -------------- | -------------------------------------------------------------- | ----------------------------- |
| `github.read`  | See your repositories, pull requests, issues and notifications | at the first sign-in          |
| `github.write` | Comment, review, merge, and open issues and pull requests as you | the first time you ask to write |

In `deterministic` and `stub` mode the sign-in offers one made-up account, `retz8`. In `deterministic` mode, submitting or approving a review asks for `github.write`.

In `live` mode the sign-in sends you to GitHub. The agent keeps your GitHub token and gives A2UIVerse a token of its own. GitHub tool calls that GitHub doesn't mark read-only need `github.write`.

### Setting up live sign-in

One-time. The agent signs in to GitHub through an OAuth App you register:

1. On GitHub: Settings → Developer settings → OAuth Apps → New OAuth App.
2. **Authorization callback URL:** the agent's finish address, `http://localhost:11001/sign-in/finish`. Behind a tunnel, add the address the agent runs at with `--public-url`, followed by `/sign-in/finish`, as a second callback URL.
3. Generate a client secret, and put the client ID and the secret in `.env` as `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.

The agent asks GitHub for `repo`, `read:org`, `notifications` and `user:email`; GitHub's MCP server asks `notifications` of its notification tools. GitHub's OAuth App tokens don't expire. Revoking the app at GitHub ends the sign-in: the next request fails, and A2UIVerse asks you to sign in again. Uninstalling the app in A2UIVerse revokes the agent's grant at GitHub.

## Test

```bash
uv run pytest
```

No model calls and no credentials needed.

## Recording

The canned data behind `deterministic` and `stub` comes from recorded live runs, not hand-written.

```bash
A2UI_RECORD_DIR=.recordings uv run python -m app --mode live --host localhost
uv run python scripts/record_beats.py --model <model>
uv run python scripts/derive_corpus.py
```

Recording runs in `live` mode. The script signs in at the start: it opens the agent's sign-in in your browser, where you sign in with GitHub, and catches the return on a `localhost` address, so run it on the machine whose browser you sign in with. Nothing is scrubbed: the recordings come from public repository data.

## Narrowing what it can do

The agent already has every tool, so there's nothing to allow; what your GitHub account reaches is the limit. To give it less:

- **Ask for fewer toolsets.** `GITHUB_MCP_TOOLSETS` in `app/mcp.py` is sent as the server's `X-MCP-Toolsets` header. Set it to a list such as `repos,issues,pull_requests` instead of `all`, and update the pin in `tests/test_llm_mcp.py`.
- **Read tools only.** The server also takes an `X-MCP-Readonly: true` header; add it in `mcp_headers()` in `app/mcp.py`.

## Connecting to A2UIVerse

Launch it from the [A2UIVerse](https://github.com/retz8/a2uiverse) repo with `pnpm dev:agents --only github` (add `--mode live` for real data). The launcher starts the agent on the port its roster gives the app, the `default_port` in [`app/config.py`](app/config.py), packs the catalog with Stellify, and installs the app into the running A2UIVerse from the agent's card. `pnpm dev:all` starts A2UIVerse and the agents together.
