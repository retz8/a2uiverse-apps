# linear-catalog

The Linear app's A2UI catalog: the **basic catalog** as schema and implementation, under a
product theme.

`CATALOG` re-uses `basicCatalog`'s implementations and functions from `@a2ui/react` unchanged and
appends two product components, the two marks every row of Linear's issue list carries:

- **`StatusIcon`** — an issue's workflow state, drawn as Linear's status circle: dashed for
  backlog, empty for unstarted, part-filled for started, filled with a check for completed,
  filled with a cross for canceled or duplicate, each in its state's color.
- **`PriorityIcon`** — an issue's priority: three rising bars filled by level, a filled square
  with an exclamation mark for urgent, three dashes for no priority.

The `Provider` also installs the bundle's markdown renderer (`src/markdown.ts`) through upstream's
`MarkdownContext`, because Linear writes descriptions and comments in Markdown: body text inside a
Linear fragment renders the subset the basic `Text` promises — raw HTML escaped, a link as its
text, an image as its alt text — and text anywhere else on the page is untouched.

The basic catalog cannot vary a row's look by data — a text variant is fixed per template — so a
per-row drawn state needs a component of its own (SPEC §9.2). The rest of the product identity is
the `Provider`'s tokens and the scoped theme sheet.

The palette, the icons' colors and their proportions are measured on Linear's documentation
screenshots of its web app, in both appearances; `src/provider.tsx` names what was sampled
where, and which values stand in for an appearance that had no sample.

## Shape

| File                           | What it is                                                                                                |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `catalogs/v0.9.1/catalog.json` | Upstream's basic catalog with four identity fields rewritten (`$id`, `catalogId`, `title`, `description`) |
| `src/catalog.ts`               | The runtime catalog: `basicCatalog`'s components and functions, verbatim, plus the two icons              |
| `src/provider.tsx`             | The token theme, light and dark, sampled from Linear's web app; installs the markdown renderer            |
| `src/markdown.ts`              | The markdown renderer: the basic `Text`'s subset, no HTML, links or images                                |
| `src/theme.css`                | The product sheet, scoped to the Provider's wrapper: rows, the icons' colors, buttons                     |
| `src/catalog.parity.test.ts`   | Schema ↔ runtime lockstep, and the upstream-drift detector                                                |

## The one rule

The Provider writes its custom properties **on its own wrapper element** — never `:root` — and
loads a stylesheet scoped to that same wrapper class. Nothing is global. This is the bundle's one
Provider and one CSS setup; a host wraps each of this catalog's fragments in it and registers
nothing of its own.

## Build and test

```bash
pnpm install
pnpm build
pnpm test
```
