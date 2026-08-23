# a2uiverse-apps

Vendor apps for [A2UIVerse](https://github.com/retz8/a2uiverse).

Each app is an A2A agent backed by its vendor's official public MCP server, painting its own UI with A2UI, packaged as an A2UIVerse app bundle. A vendor catalog is the A2UI basic catalog themed to mimic the vendor's product. They exercise cross-agent composition in the platform: several vendors, each in its own look, composed into one surface.

Roster: `github` · `gmail` · `google-calendar`.

These apps depend on `@a2uiverse/sdk` — the app manifest contract and protocol extension — and on the A2UI/A2A protocols. They never depend on anything else in the platform.

## Layout

One folder per app. Each folder is one installable app: its A2A agent, its `<vendor>-catalog` (catalog schema + React implementation), and its app manifest.

```
<vendor>/
  agent/              the A2A agent
  <vendor>-catalog/   catalog.json + React implementation
  <manifest>          the app manifest, per @a2uiverse/sdk
```

The catalogs share one pnpm workspace with Turborepo over it; each agent is its own project.

```
pnpm install      # fresh clone
pnpm verify       # build · typecheck · test · lint · format:check over every catalog
```

## Apps

| App       | Port  | Agent                                                                                                                                                                                                                       | Catalog                   |
| --------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `github/` | 11001 | Python (uv) — `cd github/agent && uv sync`, then `uv run python -m deterministic_agent` (no model), `TOOL_BACKEND=stub uv run python -m llm_agent` (model + canned data), `uv run python -m llm_agent` (model + GitHub MCP) | `github-catalog` — Primer |

Catalogs are consumed by the platform straight from this repo as git dependencies (`github:retz8/a2uiverse-apps#path:<vendor>/<vendor>-catalog`); nothing is published to a registry. Agent test suites run per the app's `agent/README.md`.

## Status

In development. The platform design lives in the `a2uiverse` repo's `SPEC.md`.
