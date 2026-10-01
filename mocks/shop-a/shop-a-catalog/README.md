# shop-a-catalog

An A2UI catalog for Aperture & Co, an invented camera store: the basic A2UI catalog, unchanged, in a neutral theme with a warm-brown accent.

The catalog adds no components of its own. `CATALOG` reuses the basic catalog's components and functions from `@a2ui/react` as they are, and the look comes entirely from the `Provider`.

## Using it

```ts
import {CATALOG, CATALOG_ID, Provider} from 'shop-a-catalog';
```

- **`CATALOG`**: the basic components and functions, ready for an A2UI `MessageProcessor`.
- **`CATALOG_ID`**: the catalog's id. A surface created with it renders with this catalog.
- **`Provider`**: the store's theme. Wrap each surface rendered with this catalog in it; nothing else needs setting up.

## Theme

The Provider sets its design tokens and a small stylesheet on its own wrapper element, never on the page, so the theme stays inside the wrapper. The palette is neutral except for the accent, warm brown here and teal in [`shop-b-catalog`](../../shop-b/shop-b-catalog/), so the two stores can be told apart side by side. Everything else keeps the basic catalog's defaults.

Light or dark follows the OS.

## Files

| File                           | What it is                                                                   |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `catalogs/v0.9.1/catalog.json` | the upstream basic catalog, with only its ids, title and description changed |
| `src/catalog.ts`               | the runtime catalog: the basic components and functions                      |
| `src/provider.tsx`             | the tokens, light and dark                                                   |
| `src/theme.css`                | the stylesheet, scoped to the Provider's wrapper: the accent on row hover    |

## Build and test

```bash
pnpm --filter shop-a-catalog build
pnpm --filter shop-a-catalog test
pnpm --filter shop-a-catalog check
```

`check` packs the built package with Stellify in memory and runs the gate A2UIVerse runs when it installs the app; it writes nothing.

**Keeping up with upstream.** `catalog.json` is a copy of upstream's basic catalog. A test compares it with the basic catalog of the pinned `@a2ui/react`, so bumping that version past an upstream change turns the build red. To fix it, copy the file again from upstream and restore the four changed fields (`$id`, `catalogId`, `title`, `description`).

## Connecting to A2UIVerse

[A2UIVerse](https://github.com/retz8/a2uiverse) compiles no catalog in. Its pack tool, [Stellify](https://github.com/retz8/a2uiverse/tree/main/packages/stellify), this package's one dev dependency on the platform, packs the built package into a catalog artifact, and the app is installed with it. A2UIVerse's client loads the artifact at runtime and renders every surface in this catalog with `CATALOG`, inside `Provider`. A2UIVerse puts several apps' catalogs on one page, so its collision detector flags a catalog whose styles escape its wrapper.
