# linear-catalog

An A2UI catalog for Linear: the basic A2UI catalog in Linear's look, plus the two icons every row of Linear's issue list carries.

## What's in it

`CATALOG` reuses the basic catalog's components and functions from `@a2ui/react` as they are, and adds:

- **`StatusIcon`**: an issue's workflow state as Linear's status circle — dashed for backlog, empty for unstarted, part-filled for started, a check for completed, a cross for canceled or duplicate — each in its state's colour.
- **`PriorityIcon`**: an issue's priority as three rising bars, an exclamation mark in a square for urgent, or three dashes for none.

The basic catalog can't vary a row's look by its data, so a per-row icon needs a component of its own. Colours and proportions are measured from Linear's own screenshots, in light and dark; `src/provider.tsx` notes where each came from.

**Markdown.** Linear writes descriptions and comments in Markdown, so the Provider installs a Markdown renderer for text inside its wrapper: raw HTML is escaped, a link shows as its text, an image as its alt text. Text elsewhere on the page is untouched.

## Using it

```ts
import {CATALOG, CATALOG_ID, Provider} from 'linear-catalog';
```

- **`CATALOG`**: the basic components and functions plus the two icons, ready for an A2UI `MessageProcessor`.
- **`CATALOG_ID`**: the catalog's id. A surface created with it renders with this catalog.
- **`Provider`**: Linear's theme and the Markdown renderer. Wrap each surface rendered with this catalog in it; nothing else needs setting up.

The Provider sets its design tokens and stylesheet on its own wrapper element, never on the page, so the theme stays inside the wrapper. Light or dark follows the OS.

## Files

| File                           | What it is                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| `catalogs/v0.9.1/catalog.json` | the upstream basic catalog with its ids, title and description changed, plus the two icons |
| `src/catalog.ts`               | the runtime catalog: the basic components and functions, plus the two icons                |
| `src/components/`              | `status-icon/` and `priority-icon/`: each icon's schema and render                         |
| `src/provider.tsx`             | the tokens, light and dark, sampled from Linear's web app; installs the renderer           |
| `src/markdown.ts`              | the Markdown renderer                                                                      |
| `src/theme.css`                | the stylesheet, scoped to the Provider's wrapper: rows, the icons' colours, buttons        |

## Build and test

```bash
pnpm --filter linear-catalog build
pnpm --filter linear-catalog test
```

**Keeping up with upstream.** `catalog.json` starts from a copy of upstream's basic catalog. A test compares it with the basic catalog of the pinned `@a2ui/react`, so bumping that version past an upstream change turns the build red. To fix it, copy the basic part again from upstream and restore the changed fields and the two icons.

## Connecting to A2UIVerse

The catalog depends only on A2UI. [A2UIVerse](https://github.com/retz8/a2uiverse)'s client installs it straight from this repo, with no registry:

```json
"linear-catalog": "github:retz8/a2uiverse-apps#path:linear/linear-catalog"
```

The client renders every surface carrying `CATALOG_ID` with `CATALOG`, inside `Provider`. Until A2UIVerse installs app bundles, the client also lists the catalog by hand in its catalog map. A2UIVerse puts several apps' catalogs on one page, so its collision tests fail if a catalog's styles escape its wrapper.
