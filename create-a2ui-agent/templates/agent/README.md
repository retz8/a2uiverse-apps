# __DISPLAY_NAME__ agent

An A2A agent for __DISPLAY_NAME__. It answers questions by painting A2UI surfaces with [`__PACKAGE_NAME__`](../__PACKAGE_NAME__/). It runs on port **__PORT__** and is built on [`a2ui-agent-kit`](https://github.com/retz8/a2uiverse-apps/tree/main/agent-kit), pinned to a commit in `pyproject.toml`.

## What to fill in

Every `TODO` in the scaffold marks something only you can write. Delete this section once they're done.

| Where                                 | What                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------ |
| `app/card.py`                         | The skills: one per capability, with a few example questions each        |
| `app/prose.py`                        | What the agent is and what it must never do, in __DISPLAY_NAME__'s voice |
| `app/knowledge/__APP_ID__-domain.md`  | What __DISPLAY_NAME__'s things are, and the decisions that hang on them  |
| `app/knowledge/brand-guidance.md`     | How a surface should look to read as __DISPLAY_NAME__'s own UI           |
| `app/knowledge/examples/`             | Example surfaces, one per layout idiom; the tests validate each          |
| `app/mcp.py`                          | The MCP server's address and credential                                  |
| `app/tools.py` + `app/fixtures/stub/` | The stub: the live tools mirrored over canned data                       |
| `app/fixtures/deterministic/`         | The canned answers `deterministic` plays                                 |
| `scripts/record_beats.py`             | The conversations to record                                              |
| this README                           | "What it can do" and "Credentials" below                                 |
| `../README.md`                        | The app's opening line, its MCP server, and what the agent does          |

## What it can do

TODO: what the agent reads and writes through __DISPLAY_NAME__'s MCP server, which writes are shown as a proposal first, and what it can't do.

## Run

```bash
uv sync
cp .env.example .env
uv run python -m app --mode deterministic
```

| Mode            | What runs                                   | Needs                                   |
| --------------- | ------------------------------------------- | --------------------------------------- |
| `deterministic` | canned answers, no model                    | nothing                                 |
| `stub`          | the model over canned __DISPLAY_NAME__ data | `GOOGLE_API_KEY`                        |
| `live`          | the model over __DISPLAY_NAME__'s MCP server | `GOOGLE_API_KEY`, the credential below |

A fresh scaffold runs before you edit anything: `deterministic` paints a greeting card, `stub` holds one placeholder tool, and `live` stops with a "not wired yet" message until `app/mcp.py` names the MCP server.

Other flags: `--port`, `--host`, and `--base-url`, the address the agent card advertises.

## Credentials (live mode)

TODO: how to get the credential __DISPLAY_NAME__'s MCP server takes, and where it goes in `.env`.

> [!IMPORTANT]
> The agent can do anything its credential can, as that credential's user. Scope it to what you want the agent to be able to do.

## Test

```bash
uv run pytest
```

No model calls and no credentials needed. The first run writes `tests/golden/llm_system_prompt.skeleton.txt`: commit it, and refresh it when you change the prompt.

## Recording

The canned data behind `deterministic` and `stub` should come from recorded live runs, not be hand-written.

```bash
A2UI_RECORD_DIR=.recordings uv run python -m app --mode live --host localhost
uv run python scripts/record_beats.py --model <model>
```

The recorded MCP payloads become `app/fixtures/stub/`, and the painted streams become `app/fixtures/deterministic/`. Never commit real personal data: if __DISPLAY_NAME__'s data is personal, scrub it as it's recorded.

## Choosing its tools

`TOOL_FILTER` in `app/mcp.py` lists the server's tools the agent holds; empty means all of them. Whenever the list changes, mirror it in the stub (`app/tools.py`) and describe what each tool returns in `app/knowledge/__APP_ID__-domain.md`.

## Connecting to A2UIVerse

Put the app folder in A2UIVerse's agents dir, which by default is the `a2uiverse-apps` checkout beside the `a2uiverse` repo, and launch it from the [A2UIVerse](https://github.com/retz8/a2uiverse) repo with `pnpm dev:agents --only __APP_ID__`. The launcher finds the agent through the app's [`manifest.json`](../manifest.json) and starts it on the port listed there. Start agents before the platform, because the orchestrator reads each agent card once, at boot. `pnpm dev:all` does both, in that order.
