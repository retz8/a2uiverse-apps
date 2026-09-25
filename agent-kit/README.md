# a2ui-agent-kit

A Python kit for building A2A agents that answer with UI they generate in A2UI. It carries everything the apps in this repo share — the A2A server, the three run modes, catalog loading and validation, prompt assembly, recording — so each app keeps only what is its own: its card, prompt prose, tools, fixtures and knowledge docs.

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

Flags: `--mode`, `--port`, `--host`, and `--base-url`, the address the agent card advertises. `MODEL_NAME` picks the model; it defaults to `gemini-3.7-flash`.

## What's in it

| Module                                | What it does                                                                                       |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `cli`, `server`, `modes`              | The entrypoint, the A2A server with one agent card for every mode, and the executor per mode       |
| `executor_llm`                        | Streams the model's A2UI as it's written, validates it against the catalog at the end, and retries |
| `executor_deterministic`, `responses` | Deterministic mode: canned A2UI per action or question, from the app's fixtures                    |
| `catalog`, `prompt`, `knowledge`      | Loads the app's catalog, validates surfaces against it, and assembles the system prompt            |
| `toolset`, `tool_shaping`             | A hook on every MCP call, to change its arguments on the way out or its result on the way back     |
| `recorder`, `corpus`, `beats`         | Recording: what the agent painted and what the MCP server returned, and scripted conversations     |
| `google_adc`                          | Optional: sign in to a Google MCP server with Application Default Credentials                      |
| `paint_meta`                          | Optional: a short title per painted surface, and a mark on a surface that asks something           |
| `testing`                             | Runs an executor in-process, for an app's own tests                                                |

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

[A2UIVerse](https://github.com/retz8/a2uiverse)'s launcher starts an agent through this same entrypoint, passing the port from the app's manifest. `paint_meta` is the part A2UIVerse's canvas reads: the paint titles and question marks ride beside the A2UI, and any other client ignores them.
