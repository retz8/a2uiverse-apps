# __PACKAGE_NAME__

An A2UI catalog for __DISPLAY_NAME__, built on __DISPLAY_NAME__'s own design system. It targets A2UI **v0.9.1** on top of `@a2ui/react`.

## Two halves of one contract

- **`catalogs/v0.9.1/catalog.json`**: the catalog document. It describes every component and function to the model. The agent reads it to build its prompt and to validate what it paints.
- **`src/`**: the React implementation. For each component, a zod schema and a render, assembled into `CATALOG`.

The scaffold ships one component, `Text`, drawn as plain HTML so the package works before the design system is wired in.

## Using it

```ts
import {CATALOG, CATALOG_ID, Provider} from '__PACKAGE_NAME__';
```

- **`CATALOG`**: every component and function, ready for an A2UI `MessageProcessor`.
- **`CATALOG_ID`**: the catalog's id. A surface created with it renders with this catalog.
- **`Provider`**: the design system's theme and styles. Wrap each surface rendered with this catalog in it; nothing else needs setting up.

TODO: wire the design system into `src/provider.tsx` and `src/theme.css`. Keep its tokens scoped to the Provider's wrapper rather than the page, and anchor its overlays inside that wrapper, so they stay themed and never land on top of anything else on the page. Ship the design system as this package's own dependency at an exact version; the host supplies only React, `@a2ui/react` / `@a2ui/web_core`, and zod.

## Build and test

From this folder:

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm check
```

`check` packs the built package with Stellify in memory and runs the gate A2UIVerse runs when it installs the app; it writes nothing.

Two tests keep the halves in step: **parity** checks that `catalog.json` declares exactly the registered components and functions, and **catalog** checks that `CATALOG` holds exactly them too.

## Layout

```
catalogs/v0.9.1/catalog.json   the catalog document
src/
  catalog.ts                   assembles CATALOG
  catalog.registry.ts          the list of components and functions the tests walk
  components/<name>/           <name>.schema.ts (zod), <name>.tsx (render), index.ts
  functions/                   one file per client-side function
  provider.tsx + theme.css     the Provider and its stylesheet
```

## Adding a component

Each component takes five steps: its `catalog.json` entry, its zod schema, its render, its folder's `index.ts`, and its entry in `catalog.registry.ts` and `catalog.ts`. In `a2uiverse-apps`, the `design-catalog-component` and `build-catalog-component` skills walk you through them.

## Connecting to A2UIVerse

[A2UIVerse](https://github.com/retz8/a2uiverse) compiles no catalog in. Its pack tool, [Stellify](https://github.com/retz8/a2uiverse/tree/main/packages/stellify), this package's one dev dependency on the platform, packs the built package into a catalog artifact, and the app is installed with it. A2UIVerse's client loads the artifact at runtime and renders every surface in this catalog with `CATALOG`, inside `Provider`. A2UIVerse puts several apps' catalogs on one page, so its collision detector flags a catalog whose styles escape its wrapper.
