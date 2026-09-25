# gmail-catalog

The Gmail app's A2UI catalog: the basic A2UI catalog, unchanged, in Gmail's **Material 3** look.

The catalog adds no components of its own. `CATALOG` reuses the basic catalog's components and functions from `@a2ui/react` as they are, and Gmail's look comes entirely from the `Provider`.

## Using it

```ts
import {CATALOG, CATALOG_ID, Provider} from 'gmail-catalog';
```

- **`CATALOG`**: the basic components and functions, ready for an A2UI `MessageProcessor`.
- **`CATALOG_ID`**: the catalog's id. A surface created with it renders with this catalog.
- **`Provider`**: Gmail's theme. The host wraps each of this catalog's fragments in it and sets up nothing else.

## The theme

The Provider sets its design tokens and a small stylesheet on its own wrapper element, never on the page, so the theme stays inside the fragment. It carries Material 3's signature: the pill button, the raised card on a lighter background, the rounded field and chip. Everything else keeps the basic catalog's defaults.

Light or dark follows the OS. Google Sans is used where the system has it, falling back to Roboto and then the system font.

## Files

| File                           | What it is                                                                   |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `catalogs/v0.9.1/catalog.json` | the upstream basic catalog, with only its ids, title and description changed |
| `src/catalog.ts`               | the runtime catalog: the basic components and functions                      |
| `src/provider.tsx`             | the Material 3 tokens, light and dark                                        |
| `src/theme.css`                | the stylesheet, scoped to the Provider's wrapper                             |

## Build and test

```bash
pnpm --filter gmail-catalog build
pnpm --filter gmail-catalog test
```

**Keeping up with upstream.** `catalog.json` is a copy of upstream's basic catalog. A test compares it with the basic catalog of the pinned `@a2ui/react`, so bumping that version past an upstream change turns the build red. To fix it, copy the file again from upstream and restore the four changed fields (`$id`, `catalogId`, `title`, `description`).
