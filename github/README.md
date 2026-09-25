# GitHub

An app for GitHub: an A2A agent that works on your repositories, issues, pull requests and notifications through the remote GitHub MCP server, and the A2UI catalog it paints with, built on Primer, GitHub's own design system.

| Part                                 | What it is                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------------- |
| [`agent/`](agent/)                   | the A2A agent (Python, uv), on port 11001. Runs on canned answers, on canned data, or live. |
| [`github-catalog/`](github-catalog/) | the A2UI catalog: 146 Primer components                                                     |
| [`manifest.json`](manifest.json)     | the app manifest: its id, agent URL and catalog                                             |

## Quick start

```bash
cd agent
uv sync
uv run python -m app --mode deterministic   # canned answers, no key needed
```

Live mode needs a Gemini key and a GitHub token, and acts as that token's user — see the [agent README](agent/README.md).

## Connecting to A2UIVerse

`manifest.json` is [A2UIVerse](https://github.com/retz8/a2uiverse)'s app manifest, a placeholder until A2UIVerse's bundle format lands. How each half connects is in its own README: the [agent](agent/README.md#connecting-to-a2uiverse) and the [catalog](github-catalog/README.md#connecting-to-a2uiverse).
