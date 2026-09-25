# circleci-catalog

The CircleCI app's A2UI catalog: the basic A2UI catalog in CircleCI's look, plus one component of its own.

## What's in it

`CATALOG` reuses the basic catalog's components and functions from `@a2ui/react` as they are, and adds **`StatusBadge`**: a pipeline, workflow or job status drawn as CircleCI's status pill, in that status's colour.

The basic catalog can't colour a row by its data, so a per-row status needs a component of its own. The colours are sampled from CircleCI's web app — Running, Success, Failed, and the slate of a queued run. Any other status is drawn neutral.

## Using it

```ts
import {CATALOG, CATALOG_ID, Provider} from 'circleci-catalog';
```

- **`CATALOG`**: the basic components and functions plus `StatusBadge`, ready for an A2UI `MessageProcessor`.
- **`CATALOG_ID`**: the catalog's id. A surface created with it renders with this catalog.
- **`Provider`**: CircleCI's theme. The host wraps each of this catalog's fragments in it and sets up nothing else.

The Provider sets its design tokens and stylesheet on its own wrapper element, never on the page, so the theme stays inside the fragment. Light or dark follows the OS.

## Files

| File                           | What it is                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| `catalogs/v0.9.1/catalog.json` | the upstream basic catalog with its ids, title and description changed, plus `StatusBadge` |
| `src/catalog.ts`               | the runtime catalog: the basic components and functions, plus `StatusBadge`                |
| `src/components/status-badge/` | `StatusBadge`'s schema and render                                                          |
| `src/provider.tsx`             | the tokens, light and dark, sampled from CircleCI's web app                                |
| `src/theme.css`                | the stylesheet, scoped to the Provider's wrapper: rows, the pill, buttons                  |

## Build and test

```bash
pnpm --filter circleci-catalog build
pnpm --filter circleci-catalog test
```

**Keeping up with upstream.** `catalog.json` starts from a copy of upstream's basic catalog. A test compares it with the basic catalog of the pinned `@a2ui/react`, so bumping that version past an upstream change turns the build red. To fix it, copy the basic part again from upstream and restore the changed fields and `StatusBadge`.
