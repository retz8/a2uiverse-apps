# calendar-catalog

The Google Calendar app's A2UI catalog: the **basic catalog** as schema and implementation, under
Calendar's **Material 3** product theme.

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

The Provider writes its custom properties **on its own wrapper element** — never `:root`, no
stylesheet, no font loaded, nothing global (phase-2 decision 4).

Calendar and Gmail are the same design system by the same company, so the theme is built on
where Calendar genuinely differs rather than on restating Material 3 a second time (task-2.7
decision 3):

- **A dense agenda on a flat ground**, not cards floating on a tinted one. The card trades
  elevation for a hairline rule (`--a2ui-card-box-shadow: none` plus `--a2ui-card-border`), and
  the layout gaps — `--a2ui-list-gap`, `--a2ui-column-gap`, `--a2ui-row-gap`,
  `--a2ui-card-padding`, `--a2ui-card-margin` — tighten below what the spacing scale alone gives.
- **A smaller type scale and a tighter spacing scale**, because an agenda row packs a time, a
  title and a location into the height Gmail gives a sender and a subject.
- **A per-event calendar colour** (Peacock) as the accent, rather than one product blue.

What the two products genuinely share stays shared — the pill button, the Google Sans stack, and
the rounded field and chip are Material 3's signature in both. Faking a difference there would
invent contrast rather than carry it.

That the two bundles actually resolve the same token to different values is asserted in the
client, where both are on the page at once; a bundle cannot check it alone without depending on
its sibling, which SPEC §13 forbids.

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
pnpm --filter calendar-catalog build
pnpm --filter calendar-catalog test
```
