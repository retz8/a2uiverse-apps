# Google Calendar

An app for Google Calendar: an A2A agent that reads events, creates them and answers invitations through Google's Calendar MCP server, and the A2UI catalog it paints with, in Calendar's Material 3 look.

| Part                                     | What it is                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| [`agent/`](agent/)                       | the A2A agent (Python, uv), on port 11003. Runs on canned answers, on canned data, or live. |
| [`calendar-catalog/`](calendar-catalog/) | the A2UI catalog: the basic catalog in Calendar's Material 3 look                           |
| [`manifest.json`](manifest.json)         | the app manifest: its id, agent URL and catalog                                             |

## Quick start

```bash
cd agent
uv sync
uv run python -m app --mode deterministic   # canned answers, no key needed
```

Live mode reads a seeded demo calendar, never your primary one, and needs a Gemini key and a Google login shared with Gmail — see the [agent README](agent/README.md).

## Connecting to A2UIVerse

`manifest.json` is [A2UIVerse](https://github.com/retz8/a2uiverse)'s app manifest, a placeholder until A2UIVerse's bundle format lands. How each half connects is in its own README: the [agent](agent/README.md#connecting-to-a2uiverse) and the [catalog](calendar-catalog/README.md#connecting-to-a2uiverse).
