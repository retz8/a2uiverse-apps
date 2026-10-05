# Linear agent

An A2A agent for Linear. It answers issue-tracking questions by painting A2UI surfaces with [`linear-catalog`](../linear-catalog/), Linear's own set of A2UI components in its look. It runs on port **11005** and is built on [`a2ui-agent-kit`](../../agent-kit/).

## What it can do

In `live` mode it works through Linear's hosted MCP server.

- **Reads** your issues and a team's, one issue with its comments and linked pull requests, and a team's states, labels and members.
- **Creates** an issue, **updates** one (title, description, status, priority, assignee, labels), and **comments** on one. Every write is shown to you as a proposal first and runs only when you confirm.
- **Can't** delete an issue or a comment, create a label, or work with projects, cycles, documents, initiatives or releases.

It's allowed 10 of the server's tools: the issue, comment, team, status, label and user reads, `save_issue` and `save_comment`.

## Run

```bash
uv sync
cp .env.example .env
uv run python -m app --mode deterministic
```

| Mode            | What runs                          | Needs            |
| --------------- | ---------------------------------- | ---------------- |
| `deterministic` | canned answers, no model           | nothing          |
| `stub`          | the model over canned issues       | `GOOGLE_API_KEY` |
| `live`          | the model over Linear's hosted MCP | `GOOGLE_API_KEY` |

`deterministic` answers any question with the recorded list of your issues, and replays the recorded actions: opening an issue, proposing a status change and confirming or declining it. Opening an issue paints a new surface, as the live agent does.

Other flags: `--port`, `--host`, and `--base-url`, the address the agent card advertises. `--state-dir` moves the sign-in store from `.state/`.

## Signing in

The agent is its own sign-in: A2UIVerse signs in to it, and it signs in to Linear. Its card asks for two scopes, in the words A2UIVerse shows when it asks you:

| Scope          | Shown as                                  | Asked                            |
| -------------- | ----------------------------------------- | -------------------------------- |
| `issues.read`  | See your issues                           | at the first sign-in             |
| `issues.write` | Create, change and comment on your issues | the first time you ask to write  |

In `deterministic` and `stub` mode the sign-in offers one made-up account, `me@example.com`. In `deterministic` mode, confirming a change asks for `issues.write`.

In `live` mode the sign-in sends you to Linear, asking for `read` at first and `write` to write. The agent keeps your Linear token, refreshes it, and gives A2UIVerse a token of its own. There is nothing to set up at Linear: on the first sign-in the agent registers itself with Linear's sign-in server and keeps the registration in `.state/`.

For linked pull requests, install Linear's GitHub integration (Settings → Features → Integrations → GitHub) on the repositories the issues link to.

## Test

```bash
uv run pytest
```

No model calls, no Linear calls, no credentials needed.

## Recording

The canned data behind `deterministic` and `stub` comes from recorded live runs, not hand-written.

```bash
A2UI_RECORD_DIR=.recordings uv run python -m app --mode live --host localhost
uv run python scripts/record_beats.py --model <model>
uv run python scripts/derive_corpus.py
uv run pytest tests/test_corpus_is_publishable.py
```

The script signs in at the start: it opens the agent's sign-in in your browser, where you sign in with Linear, and catches the return on a `localhost` address, so run it on the machine whose browser you sign in with. Recording's last step **really changes** an issue's status in the workspace.

To repaint the beats after a catalog change, record them against the stub instead: the model paints over the recorded data, nothing reaches Linear, and only the deterministic corpus is derived again. `--account` signs the script in as the made-up account, with no browser. The stub holds A2U-5 as the live run left it, already In Progress, so for the recording set its `status` in `app/fixtures/stub/get-issue.json` to `In Review`, as the live run first read it, and put the file back afterwards; otherwise beat 3 has nothing to propose.

```bash
A2UI_RECORD_DIR=<scratch dir> uv run python -m app --mode stub --host localhost
uv run python scripts/record_beats.py --model <model> --record-dir <scratch dir> --account me
uv run python scripts/derive_corpus.py --beats-only
```

Values stay real except your email: while recording, the agent replaces the signed-in account's address with `me@example.com` before the model reads anything. Set a full name on the Linear account first. Without one, Linear shows the email as your name, and every assignee and author records as the placeholder. The last test fails the recordings on anything token-shaped or any other email address.

## Allowing more tools

The allowed tools are `LINEAR_TOOLS` in `app/mcp.py`. The sign-in's `read` and `write` scopes already cover much more, so that list is what limits the agent.

To allow a tool, change these together:

1. Check its name and arguments against the server's live `tools/list`.
2. Add it to `LINEAR_TOOLS` in `app/mcp.py`, and take it out of the withheld comment.
3. Update the pin in `tests/test_llm_mcp.py`.
4. Add it to the stub, `STUB_TOOLS` in `app/tools.py`, over data from a recorded run (`scripts/derive_corpus.py` writes it).
5. Describe what it returns in `app/knowledge/linear-domain.md`. For a write, add a proposal to the prompt, so it runs only when you confirm, and the tool to `tool_scopes` in `app/sign_in.py`.

## Connecting to A2UIVerse

Launch it from the [A2UIVerse](https://github.com/retz8/a2uiverse) repo with `pnpm dev:agents --only linear` (add `--mode live` for real data). The launcher starts the agent on the port its roster gives the app, the `default_port` in [`app/config.py`](app/config.py), packs the catalog with Stellify, and installs the app into the running A2UIVerse from the agent's card. `pnpm dev:all` starts A2UIVerse and the agents together.
