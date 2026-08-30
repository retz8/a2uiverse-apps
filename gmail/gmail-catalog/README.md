# gmail-catalog

The Gmail app's A2UI catalog: the **basic catalog** as schema and implementation, under a
**Material 3** product theme.

The bundle ships no component mapping of its own. `CATALOG` re-uses `basicCatalog`'s
implementations and functions from `@a2ui/react` unchanged; the product identity is entirely
in the `Provider`'s tokens. That is the second of the two catalog kinds on the roster — the
other being a full custom catalog over a real component library, as `github-catalog` is over
Primer (SPEC §4.2, phase-2 decision 3).

## Shape

| File                           | What it is                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `catalogs/v0.9.1/catalog.json` | Upstream's basic catalog with four identity fields rewritten (`$id`, `catalogId`, `title`, `description`) and nothing appended |
| `src/catalog.ts`               | The runtime catalog: `basicCatalog`'s components and functions, verbatim                                                       |
| `src/provider.tsx`             | The Material 3 token theme, light and dark                                                                                     |
| `src/catalog.parity.test.ts`   | Schema ↔ runtime lockstep, and the upstream-drift detector                                                                     |

## Theme

The Provider writes ~25 custom properties **on its own wrapper element** — never `:root` — and
alongside them a product stylesheet scoped to that same wrapper class, loaded on first mount.
Nothing is global (phase-2 decision 4, SPEC §14): tokens carry the palette, and the sheet styles
the basic components' runtime DOM where a token cannot reach it. It sets the base tier
(colour, shape, type, spacing) plus the short list of per-component tokens carrying Material 3
Expressive's signature: the pill button, the raised card on a lighter ground, and the rounded
field and chip. Every other component token falls through to the basic catalog's defaults.

Appearance follows the OS, from the same `prefers-color-scheme` query the canvas shell reads,
so a fragment tracks the surface it is mounted into without depending on anything the shell owns.

Google Sans is not distributed as a web font: the stack prefers it where the platform has it
and falls back through Roboto to the system stack.

## Upstream drift

`catalog.json` is a checked-in copy of `specification/v0_9/catalogs/basic/catalog.json`. The
parity test compares it against the basic catalog of the **pinned** `@a2ui/react`, so bumping
that pin past a basic-catalog change turns the build red. The fix is to refresh the copy from
the `upstream/main` ref and re-apply the four identity fields — see `CLAUDE.md` §2 for how to
read the spec.

## Build and test

```bash
pnpm --filter gmail-catalog build
pnpm --filter gmail-catalog test
```
