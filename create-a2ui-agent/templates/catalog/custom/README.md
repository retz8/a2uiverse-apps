# __PACKAGE_NAME__

The __DISPLAY_NAME__ app's A2UI catalog: a **custom catalog** over the product's own design
system, targeting protocol **v0.9.1**. Two halves of one contract:

- **`catalogs/v0.9.1/catalog.json`** — the hand-authored catalog document: the JSON-Schema
  description of every component and function an agent may emit, with prop semantics written
  for a model reader.
- **`src/`** — the client half: a zod schema and a React implementation per component, plus
  the local function implementations, assembled into the `CATALOG` object a renderer consumes.

The scaffold ships one seed component, `Text`, rendered as plain HTML so the package works
before the design system is wired. Each real component goes through the
`design-catalog-component` / `build-catalog-component` skills: schema, render, folder barrel,
registry entry, catalog registration — and the parity test keeps `catalog.json` and the
registry in lockstep.

## Layout

| Path                             | What it is                                                             |
| -------------------------------- | ---------------------------------------------------------------------- |
| `src/components/<name>/`         | One folder per component: `<name>.schema.ts`, `<name>.tsx`, `index.ts` |
| `src/functions/`                 | One module per local function                                          |
| `src/catalog.registry.ts`        | `COMPONENTS` / `FUNCTIONS` by name — drives the parity test            |
| `src/catalog.ts`                 | The runtime `CATALOG`: every implementation, registered                |
| `src/provider.tsx` + `theme.css` | The one Provider and one CSS setup — **TODO: wire the design system**  |

## The one rule

The bundle ships **exactly one Provider and one CSS setup**, both scoped to the Provider's own
scope element — never `:root`. The Provider wires the design system, brings its own stylesheets
and tokens, and anchors any portal root inside the boundary. The bundle carries its design
system as its own dependencies at exact versions; the host supplies only React, the A2UI
runtime, and zod, and registers nothing of its own.

## Build and test

```bash
pnpm install
pnpm build
pnpm test
```
