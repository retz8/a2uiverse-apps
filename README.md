# a2uiverse-apps

Mock vendor apps for [A2UIVerse](https://github.com/retz8/a2uiverse).

Each app is an A2A agent that paints its own UI with A2UI, packaged as an A2UIVerse app bundle. They exist to exercise cross-agent composition in the platform: several vendors, each in its own design system, composed into one surface.

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

## Status

In development. The platform design lives in the `a2uiverse` repo's `SPEC.md`.
