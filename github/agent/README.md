# GitHub agent

The GitHub app's A2A agent. It answers GitHub questions on the A2UIVerse canvas and paints its answers with [`github-catalog`](../github-catalog/), built on Primer, GitHub's own design system. It runs on port **11001** and is built on the [agent kit](../../agent-kit/).

## What it can do

In `live` mode it works through the remote GitHub MCP server with its full tool set, acting as the user who owns the token. It reads repositories, issues, pull requests and notifications, and it can comment, review, merge and edit files.

- Writes that carry content — a comment, a review, an edit — are proposed on the canvas first and run only when you confirm.
- Quick toggles that are easy to undo run straight away.

> [!IMPORTANT]
> The agent can do anything your token can, on every repository the token reaches, and it does it under your name. Scope `GITHUB_MCP_PAT` to what you want the agent to be able to do.

## Run

```bash
uv sync
cp .env.example .env
uv run python -m app --mode deterministic
```

| Mode            | What runs                                 | Needs                              |
| --------------- | ----------------------------------------- | ---------------------------------- |
| `deterministic` | canned answers, no model                  | nothing                            |
| `stub`          | the model over canned GitHub data         | `GOOGLE_API_KEY`                   |
| `live`          | the model over the real GitHub MCP server | `GOOGLE_API_KEY`, `GITHUB_MCP_PAT` |

`deterministic` answers any question with a recorded notifications digest, and answers the Primer components' demo actions with canned responses.

You rarely start it by hand: the platform's launcher starts every agent (`pnpm dev:agents` in the `a2uiverse` repo). Other flags: `--port`, `--host`, and `--base-url`, the address the agent card advertises.

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

Nothing is scrubbed: the recordings come from public repository data. The canvas replays the platform uses are recorded separately, through the orchestrator, in the `a2uiverse` repo.

## Troubleshooting

**A dead token doesn't look like an auth error.** With an expired or revoked `GITHUB_MCP_PAT`, the agent starts with no tools and the turn ends in an apology on the canvas (`MALFORMED_FUNCTION_CALL` in the log). Check the token first:

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer $(grep '^GITHUB_MCP_PAT=' .env | cut -d= -f2-)" \
  https://api.github.com/user
```

`200` means the token is fine; `401` means it's expired or revoked. Extending an expired classic token generates a new value, so copy it into `.env` again.
