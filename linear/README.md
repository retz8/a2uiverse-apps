# Linear

An app for Linear: an A2A agent that reads, creates and updates issues and comments on them through Linear's hosted MCP server, and the A2UI catalog it paints with, in Linear's look.

| Part                                 | What it is                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------------- |
| [`agent/`](agent/)                   | the A2A agent (Python, uv), on port 11005. Runs on canned answers, on canned data, or live. |
| [`linear-catalog/`](linear-catalog/) | the A2UI catalog: the basic catalog in Linear's look, plus `StatusIcon` and `PriorityIcon`  |
| [`manifest.json`](manifest.json)     | the app manifest: its id, agent URL and catalog                                             |

## Quick start

```bash
cd agent
uv sync
uv run python -m app --mode deterministic   # canned answers, no key needed
```

Live mode needs a Gemini key and a Linear API key — see the [agent README](agent/README.md).

## Connecting to A2UIVerse

`manifest.json` is [A2UIVerse](https://github.com/retz8/a2uiverse)'s app manifest, a placeholder until A2UIVerse's bundle format lands. How each half connects is in its own README: the [agent](agent/README.md#connecting-to-a2uiverse) and the [catalog](linear-catalog/README.md#connecting-to-a2uiverse).
