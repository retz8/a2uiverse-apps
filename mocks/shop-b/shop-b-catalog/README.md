# shop-b-catalog

The Shop B app's A2UI catalog: the **basic catalog** as schema and implementation,
under a product theme.

The bundle ships no component mapping of its own. `CATALOG` re-uses `basicCatalog`'s
implementations and functions from `@a2ui/react` unchanged; the product identity is entirely
in the `Provider`'s tokens and the scoped theme sheet.

## Shape

| File                           | What it is                                                                                                |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `catalogs/v0.9.1/catalog.json` | Upstream's basic catalog with four identity fields rewritten (`$id`, `catalogId`, `title`, `description`) |
| `src/catalog.ts`               | The runtime catalog: `basicCatalog`'s components and functions, verbatim                                  |
| `src/provider.tsx`             | The token theme, light and dark; the accent is this store's own (teal)                                    |
| `src/theme.css`                | The scoped sheet, where the accent reaches what a token cannot (the row hover)                            |
| `src/catalog.parity.test.ts`   | Schema ↔ runtime lockstep, and the upstream-drift detector                                                |

## The one rule

The Provider writes its custom properties **on its own wrapper element** — never `:root` — and
loads a stylesheet scoped to that same wrapper class. Nothing is global. This is the bundle's
one Provider and one CSS setup; a host wraps each of this catalog's fragments in it and
registers nothing of its own.

## Build and test

```bash
pnpm install
pnpm build
pnpm test
```
