# shop-b-catalog

An A2UI catalog for Northlight, an invented camera store: the basic A2UI catalog, unchanged, in a neutral theme with a teal accent.

The catalog adds no components of its own. `CATALOG` reuses the basic catalog's components and functions from `@a2ui/react` as they are, and the look comes entirely from the `Provider`.

## Using it

```ts
import {CATALOG, CATALOG_ID, Provider} from 'shop-b-catalog';
```

- **`CATALOG`**: the basic components and functions, ready for an A2UI `MessageProcessor`.
- **`CATALOG_ID`**: the catalog's id. A surface created with it renders with this catalog.
- **`Provider`**: the store's theme. Wrap each surface rendered with this catalog in it; nothing else needs setting up.

## Theme

The Provider sets its design tokens and a small stylesheet on its own wrapper element, never on the page, so the theme stays inside the wrapper. The palette is neutral except for the accent, teal here and warm brown in [`shop-a-catalog`](../../shop-a/shop-a-catalog/), so the two stores can be told apart side by side. Everything else keeps the basic catalog's defaults.

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
pnpm --filter shop-b-catalog build
pnpm --filter shop-b-catalog test
```

**Keeping up with upstream.** `catalog.json` is a copy of upstream's basic catalog. A test compares it with the basic catalog of the pinned `@a2ui/react`, so bumping that version past an upstream change turns the build red. To fix it, copy the file again from upstream and restore the four changed fields (`$id`, `catalogId`, `title`, `description`).

## Connecting to A2UIVerse

[A2UIVerse](https://github.com/retz8/a2uiverse)'s client installs it straight from this repo, with no registry:

```json
"shop-b-catalog": "github:retz8/a2uiverse-apps#path:mocks/shop-b/shop-b-catalog"
```

The client renders every surface carrying `CATALOG_ID` with `CATALOG`, inside `Provider`. Until A2UIVerse installs app bundles, the client also lists the catalog by hand in its catalog map. A2UIVerse puts several apps' catalogs on one page, so its collision tests fail if a catalog's styles escape its wrapper.
