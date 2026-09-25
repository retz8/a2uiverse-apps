# github-catalog

An A2UI catalog for GitHub, built on [Primer](https://primer.style/), GitHub's real design system. It targets A2UI **v0.9.1** on top of [`@a2ui/react`](https://www.npmjs.com/package/@a2ui/react).

It is the one fully custom catalog in this repo. The other apps theme the basic A2UI catalog; this one maps every component onto Primer.

## What's in it

**146 components and 19 client-side functions.** The components cover text and labels, buttons and toolbars, form controls, lists and menus, containers, navigation, page layouts and overlays, each with its compound children (`ActionList.Item`, `PageHeader.Title`, …). The functions are local effects, validations, formatting and boolean logic that run without a round trip to the agent.

The full list is [`catalogs/v0.9.1/catalog.json`](catalogs/v0.9.1/catalog.json).

## Two halves of one contract

- **`catalogs/v0.9.1/catalog.json`**: the catalog document. It describes every component and function to the model. The agent reads it to build its prompt and to validate what it paints.
- **`src/`**: the React implementation. For each component, a zod schema and a Primer render, assembled into `CATALOG`.

## Using it

```ts
import {CATALOG, CATALOG_ID, Provider} from 'github-catalog';
```

- **`CATALOG`**: every component and function, ready for an A2UI `MessageProcessor`.
- **`CATALOG_ID`**: the catalog's id. A surface created with it renders with this catalog.
- **`Provider`**: Primer's theme and styles. Wrap each surface rendered with this catalog in it; nothing else needs setting up.

The Provider keeps Primer inside its own wrapper. Its tokens are scoped to that wrapper rather than the page, and Primer's overlays open inside it, so they stay themed and never land on top of anything else on the page.

The package ships Primer itself at exact versions. The host supplies only what must be shared: React, `@a2ui/react` / `@a2ui/web_core`, and zod.

## Build and test

```bash
pnpm --filter github-catalog build
pnpm --filter github-catalog typecheck
pnpm --filter github-catalog test
```

Two tests keep the halves in step: **parity** checks that every zod schema matches its `catalog.json` entry, and **exact set** checks that `CATALOG` holds exactly the registered components and functions. Each component also has its own schema and render tests beside it.

## Layout

```
catalogs/v0.9.1/catalog.json   the catalog document
src/
  catalog.ts                   assembles CATALOG
  catalog.registry.ts          the list of components and functions the tests walk
  components/<name>/           <name>.schema.ts (zod) and <name>.tsx (Primer render), with tests
  functions/                   one file per client-side function, with tests
  shared/                      helpers shared across components
```

## Adding a component

Two repo skills in `.claude/skills/`: `design-catalog-component` settles the design with you and writes a decision doc; `build-catalog-component` then builds it: the `catalog.json` entry, the schema, the render, and the agent's fixture.

## Connecting to A2UIVerse

[A2UIVerse](https://github.com/retz8/a2uiverse)'s client installs it straight from this repo, with no registry:

```json
"github-catalog": "github:retz8/a2uiverse-apps#path:github/github-catalog"
```

The client renders every surface carrying `CATALOG_ID` with `CATALOG`, inside `Provider`. Until A2UIVerse installs app bundles, the client also lists the catalog by hand in its catalog map. A2UIVerse puts several apps' catalogs on one page, so its collision tests fail if a catalog's styles escape its wrapper.
