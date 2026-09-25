# Gmail

An app for Gmail: an A2A agent that reads your mail, saves drafts and applies labels through Google's Gmail MCP server, and the A2UI catalog it paints with, in Gmail's Material 3 look.

| Part                               | What it is                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| [`agent/`](agent/)                 | the A2A agent (Python, uv), on port 11002. Runs on canned answers, on canned data, or live. |
| [`gmail-catalog/`](gmail-catalog/) | the A2UI catalog: the basic catalog in Gmail's Material 3 look                              |
| [`manifest.json`](manifest.json)   | the app manifest: its id, agent URL and catalog                                             |

## Quick start

```bash
cd agent
uv sync
uv run python -m app --mode deterministic   # canned answers, no key needed
```

Live mode needs a Gemini key and a Google login shared with Calendar — see the [agent README](agent/README.md).

## Connecting to A2UIVerse

`manifest.json` is [A2UIVerse](https://github.com/retz8/a2uiverse)'s app manifest, a placeholder until A2UIVerse's bundle format lands. How each half connects is in its own README: the [agent](agent/README.md#connecting-to-a2uiverse) and the [catalog](gmail-catalog/README.md#connecting-to-a2uiverse).
