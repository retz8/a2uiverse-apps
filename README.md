# a2uiverse-apps

Vendor apps for [A2UIVerse](https://github.com/retz8/a2uiverse).

Each app is an **A2A agent** backed by its vendor's official public MCP server, painting its own UI with **A2UI**, packaged as an A2UIVerse app bundle. Together they exercise the thing the platform exists for: several vendors, each in its own look, composed onto one surface — none of them aware the others are there.

These apps depend on `@a2uiverse/sdk` and on the A2UI/A2A protocols. They never depend on anything else in the platform.

## The apps

| App         | Port    | Reads                  | Catalog            |
| ----------- | ------- | ---------------------- | ------------------ |
| `github/`   | `11001` | GitHub MCP (read-only) | `github-catalog`   |
| `gmail/`    | `11002` | Gmail MCP              | `gmail-catalog`    |
| `calendar/` | `11003` | Google Calendar MCP    | `calendar-catalog` |

Two kinds of catalog, deliberately: `github-catalog` is a full custom catalog over **Primer**, GitHub's real design system; the other two are the A2UI basic catalog under a product theme. The roster will keep both kinds — most apps will be the second, and the platform has to render them side by side without either bleeding into the other.

Every agent runs in **three modes**, on the same port:

| Mode            | What runs                   | Needs                         |
| --------------- | --------------------------- | ----------------------------- |
| `deterministic` | canned responses, no model  | nothing                       |
| `stub`          | the model over canned data  | a Gemini key                  |
| `live`          | the model over its real MCP | a key + the vendor credential |

The canned data in the first two is not hand-written — it is derived from recorded live payloads, which is what keeps it real-shaped.

## Running them

The platform's launcher starts all three, from the `a2uiverse` repo:

```bash
pnpm dev:agents                          # all three, deterministic
pnpm dev:agents --only gmail --mode live # one, live
```

Or run one by hand — each agent is its own uv project, and its `agent/README.md` covers setup, credentials, what it can and cannot do, and how to record fixtures:

```bash
cd gmail/agent && uv sync
uv run python -m deterministic_agent     # no model
TOOL_BACKEND=stub uv run python -m llm_agent
uv run python -m llm_agent               # live MCP
```

## Layout

One folder per app. Each folder is one installable app: its A2A agent, its catalog, and its manifest.

```
<vendor>/
  agent/              the A2A agent (Python, uv) — its own project
  <vendor>-catalog/   catalog.json + React implementation
  <manifest>          the app manifest, per @a2uiverse/sdk
```

The catalogs share one pnpm workspace with Turborepo over it; the agents sit outside it.

```bash
pnpm install    # fresh clone
pnpm verify     # build · typecheck · test · lint · format:check over every catalog
cd <vendor>/agent && uv run pytest   # an agent's own suite — no model calls, no credentials
```

Catalogs are consumed by the platform straight from this repo as git dependencies (`github:retz8/a2uiverse-apps#path:<vendor>/<vendor>-catalog`); nothing is published to a registry.

## Status

In development. The platform design lives in the `a2uiverse` repo's `SPEC.md`.
