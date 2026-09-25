# calendar-catalog

An A2UI catalog for Google Calendar: the basic A2UI catalog, unchanged, in Calendar's **Material 3** look.

The catalog adds no components of its own. `CATALOG` reuses the basic catalog's components and functions from `@a2ui/react` as they are, and Calendar's look comes entirely from the `Provider`.

## Using it

```ts
import {CATALOG, CATALOG_ID, Provider} from 'calendar-catalog';
```

- **`CATALOG`**: the basic components and functions, ready for an A2UI `MessageProcessor`.
- **`CATALOG_ID`**: the catalog's id. A surface created with it renders with this catalog.
- **`Provider`**: Calendar's theme. Wrap each surface rendered with this catalog in it; nothing else needs setting up.

## Theme

The Provider sets its design tokens and a small stylesheet on its own wrapper element, never on the page, so the theme stays inside the wrapper.

Calendar and Gmail are both Material 3, so the theme leans on where Calendar actually differs:

- **A dense agenda on a flat background.** Cards trade their shadow for a thin rule, and the gaps are tighter.
- **Smaller type and tighter spacing**, since an agenda row fits a time, a title and a place in the height Gmail gives a sender and a subject.
- **The calendar's own colour** (Peacock) as the accent, instead of one product blue.

What the two really share stays the same: the pill button, the rounded field and chip, and the Google Sans font stack.

Light or dark follows the OS.

## Files

| File                           | What it is                                                                   |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `catalogs/v0.9.1/catalog.json` | the upstream basic catalog, with only its ids, title and description changed |
| `src/catalog.ts`               | the runtime catalog: the basic components and functions                      |
| `src/provider.tsx`             | the Material 3 tokens, light and dark                                        |
| `src/theme.css`                | the stylesheet, scoped to the Provider's wrapper                             |

## Build and test

```bash
pnpm --filter calendar-catalog build
pnpm --filter calendar-catalog test
```

**Keeping up with upstream.** `catalog.json` is a copy of upstream's basic catalog. A test compares it with the basic catalog of the pinned `@a2ui/react`, so bumping that version past an upstream change turns the build red. To fix it, copy the file again from upstream and restore the four changed fields (`$id`, `catalogId`, `title`, `description`).

## Connecting to A2UIVerse

[A2UIVerse](https://github.com/retz8/a2uiverse)'s client installs it straight from this repo, with no registry:

```json
"calendar-catalog": "github:retz8/a2uiverse-apps#path:calendar/calendar-catalog"
```

The client renders every surface carrying `CATALOG_ID` with `CATALOG`, inside `Provider`. Until A2UIVerse installs app bundles, the client also lists the catalog by hand in its catalog map. A2UIVerse puts several apps' catalogs on one page, so its collision tests fail if a catalog's styles escape its wrapper, and a client test checks that Calendar's and Gmail's themes really do differ side by side.
