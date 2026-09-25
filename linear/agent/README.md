# Linear agent

An A2A agent for Linear. It answers issue-tracking questions by painting A2UI surfaces with [`linear-catalog`](../linear-catalog/), the basic A2UI catalog in Linear's look. It runs on port **11005** and is built on the [agent kit](../../agent-kit/).

## What it can do

In `live` mode it works through Linear's hosted MCP server.

- **Reads** your issues and a team's, one issue with its comments and linked pull requests, and a team's states, labels and members.
- **Creates** an issue, **updates** one — title, description, status, priority, assignee, labels — and **comments** on one. Every write is shown to you as a proposal first and runs only when you confirm.
- **Can't** delete an issue or a comment, create a label, or work with projects, cycles, documents, initiatives or releases.

10 of the server's tools are allowed, listed in `app/mcp.py`. To allow another, update that list, the pin in `tests/test_llm_mcp.py`, the stub in `app/tools.py`, and the domain doc in `app/knowledge/`, together.

## Run

```bash
uv sync
cp .env.example .env
uv run python -m app --mode deterministic
```

| Mode            | What runs                          | Needs                                |
| --------------- | ---------------------------------- | ------------------------------------ |
| `deterministic` | canned answers, no model           | nothing                              |
| `stub`          | the model over canned issues       | `GOOGLE_API_KEY`                     |
| `live`          | the model over Linear's hosted MCP | `GOOGLE_API_KEY`, `LINEAR_MCP_TOKEN` |

`deterministic` answers any question with the recorded list of your issues, and replays the recorded actions: opening an issue, proposing a status change and confirming or declining it. Opening an issue paints a new surface, as the live agent does.

Other flags: `--port`, `--host`, and `--base-url`, the address the agent card advertises.

## Linear credentials (live mode)

1. **A personal API key.** In Linear: Settings → Account → Security & Access. Create a key with **Read** and **Write**, and copy it (it's shown once) into `.env` as `LINEAR_MCP_TOKEN`. Limiting the key to some teams limits what the agent sees.
2. **The GitHub integration**, for linked pull requests: Settings → Features → Integrations → GitHub, installed on the repositories the issues link to.

The key acts as its user: **the agent can do whatever that user can**, within the key's permissions. With no key, `live` refuses to start rather than quietly falling back to canned data.

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

Recording's last step **really changes** an issue's status in the workspace.

Values stay real except your email: while recording, the agent replaces the key owner's address with `me@example.com` before the model reads anything. Set a full name on the Linear account first — without one, Linear shows the email as your name, and every assignee and author records as the placeholder. The last test fails the recordings on anything token-shaped or any other email address.

## Connecting to A2UIVerse

The agent speaks plain A2UI over A2A. Nothing in it needs [A2UIVerse](https://github.com/retz8/a2uiverse) to run.

- **Launch it** from the `a2uiverse` repo with `pnpm dev:agents --only linear` (add `--mode live` for real data). The launcher finds the agent through the app's [`manifest.json`](../manifest.json) and starts it on the port listed there. Start agents before the platform, because the orchestrator reads each agent card once, at boot. `pnpm dev:all` does both, in that order.
- **Paint titles.** The prompt asks the model to give each new surface a short title and to mark a surface that asks you something. The kit sends these beside the A2UI as a `paintMeta` data part. A2UIVerse uses the title to name the view, for example on its back arrow, and uses the mark to recognise a question. Other clients ignore the part.
