# circleci-catalog

An A2UI catalog for CircleCI: its own set of components, drawn in CircleCI's look.

## What's in it

Fourteen components, the parts CircleCI's pipelines UI is built from:

| Component     | What it is                                                                |
| ------------- | ------------------------------------------------------------------------- |
| `Stack`       | a column or a row of components, with gap, alignment and wrapping         |
| `Panel`       | a bordered surface; `muted` a quiet filled row, `danger` a failed step    |
| `Heading`     | a title, in three sizes                                                   |
| `Text`        | a run of text: size, muted or danger tone, weight, monospace, truncation  |
| `Link`        | text in the link color that acts                                          |
| `Button`      | the rounded button: primary, secondary or ghost                           |
| `StatusBadge` | a status as a pill, a glyph and the word, colored by the word             |
| `StatusIcon`  | a status as a round glyph, for the rows of a list                         |
| `List`        | rows, optionally joined by the tree connector a pipeline's jobs hang from |
| `ListItem`    | a row; with an action, the whole row opens what it shows                  |
| `Field`       | a small muted label over its value                                        |
| `Divider`     | a thin rule, horizontal or vertical                                       |
| `LogBlock`    | output on a dark panel with line numbers                                  |
| `LogLine`     | one line of output, as printed                                            |

It also carries the A2UI basic catalog's functions (formatting, validation, logic) unchanged.

The look is similar to CircleCI's web app without copying it: the shapes follow its screens; the colors are [Radix Colors](https://www.radix-ui.com/colors) steps near its hues, since CircleCI publishes none it could take exactly; the status glyphs are drawn here; there is no logo and no product icon. The typeface is [Inter](https://rsms.me/inter/), CircleCI's published primary typeface, shipped with the bundle under the SIL Open Font License (`src/fonts/OFL.txt`).

A2UIVerse is not affiliated with or endorsed by CircleCI.

## Using it

```ts
import {CATALOG, CATALOG_ID, Provider} from 'circleci-catalog';
```

- **`CATALOG`**: the components and functions, ready for an A2UI `MessageProcessor`.
- **`CATALOG_ID`**: the catalog's id. A surface created with it renders with this catalog.
- **`Provider`**: wrap each surface rendered with this catalog in it; nothing else needs setting up.

The Provider's wrapper carries the catalog's class and the OS appearance, light or dark. Its stylesheet, tokens and typeface are scoped to that wrapper, never to the page, so the catalog stays inside it.

## Files

| File                           | What it is                                                              |
| ------------------------------ | ----------------------------------------------------------------------- |
| `catalogs/v0.9.1/catalog.json` | the schema the agent reads: each component's props, and the functions   |
| `src/components/<name>/`       | each component's zod schema and render                                  |
| `src/catalog.ts`               | the runtime catalog: the components and the basic functions             |
| `src/provider.tsx`             | the wrapper, following the OS appearance, loading the stylesheet        |
| `src/theme.css`                | the typeface, the tokens for light and dark, and every component's look |
| `src/fonts/`                   | Inter's Latin variable font and its license                             |

## Build and test

```bash
pnpm --filter circleci-catalog build
pnpm --filter circleci-catalog test
pnpm --filter circleci-catalog check
```

`check` packs the built package with Stellify in memory and runs the gate A2UIVerse runs when it installs the app; it writes nothing.

The tests keep `catalog.json` and the zod schemas in step — the same props, required props and values — and the functions equal to the basic catalog's in the pinned `@a2ui/web_core`. Bumping that version past an upstream change to them turns the build red: copy its basic catalog's `functions` into `catalog.json` again.

## Connecting to A2UIVerse

[A2UIVerse](https://github.com/retz8/a2uiverse) compiles no catalog in. Its pack tool, [Stellify](https://github.com/retz8/a2uiverse/tree/main/packages/stellify), this package's one dev dependency on the platform, packs the built package into a catalog artifact, and the app is installed with it. A2UIVerse's client loads the artifact at runtime and renders every surface in this catalog with `CATALOG`, inside `Provider`. A2UIVerse puts several apps' catalogs on one page, so its collision detector flags a catalog whose styles escape its wrapper.
