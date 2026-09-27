# linear-catalog

An A2UI catalog for Linear: Linear's own set of components in its design language, very similar to the product without imitating it.

## What's in it

`CATALOG` is Linear's issue views taken apart into general building blocks:

| Component                       | What it is                                                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| `Panel`                         | a view's surface: a bordered, rounded panel holding one child                                |
| `Stack`                         | a column or a row of children, with a gap and an optional inset                              |
| `Divider`                       | a hairline between sections                                                                  |
| `ViewHeader`                    | a view's header bar: a context, `›`, the title                                               |
| `Section`                       | a titled block with an optional count, such as Links or Activity                             |
| `Text`                          | plain text in a type register: title, heading, body, secondary, caption                      |
| `Markdown`                      | a description or a comment, rendered from Markdown                                           |
| `Button`                        | a labelled button: primary, secondary or ghost                                               |
| `List`, `ListGroup`, `ListItem` | one-line rows with hairlines between them, grouped under a headed band; a row can be pressed |
| `Property`                      | a labelled property and its value's parts                                                    |
| `Chip`                          | a rounded chip with a colour dot or a leading glyph                                          |
| `Avatar`                        | a person's initials in a circle                                                              |
| `Icon`                          | a small system glyph: arrow, branch, pull request, link, plus, check                         |
| `StatusIcon`                    | a workflow state's glyph, drawn from its type                                                |
| `PriorityIcon`                  | a priority's glyph: rising bars, urgent's mark, none's dashes                                |

It also carries the basic catalog's functions, as `@a2ui/react` implements them.

**The look.** The palette is generated in LCH from three inputs, a base colour, an accent colour and a contrast, the way Linear describes building its own themes. The bases are the two colours Linear's brand page publishes, Mercury White `#F4F5F8` and Nordic Gray `#222326`; the accent, a desaturated blue, and the status and priority hues are this catalog's own. `src/palette.ts` generates both appearances. Every glyph is drawn here, and no Linear icon or logo is used.

**The type.** Inter ships with the bundle, under the SIL Open Font License 1.1 (`src/fonts/OFL.txt`): its Latin variable file with optical sizes from text to display, from `@fontsource-variable/inter` 5.3.0. Titles and headings use the display size.

**Markdown.** `Markdown` renders a description or a comment: raw HTML is escaped, a link shows as its text, an image as its alt text.

## Using it

```ts
import {CATALOG, CATALOG_ID, Provider} from 'linear-catalog';
```

- **`CATALOG`**: the components and functions, ready for an A2UI `MessageProcessor`.
- **`CATALOG_ID`**: the catalog's id. A surface created with it renders with this catalog.
- **`Provider`**: the palette and the typeface. Wrap each surface rendered with this catalog in it; nothing else needs setting up.

The Provider sets its tokens and its font family on its own wrapper element, never on the page, and its sheet is scoped to that wrapper, so the look stays inside it. The sheet's one `@font-face` declares a family only this catalog uses, `linear-catalog-inter`. Light or dark follows the OS.

## Files

| File                           | What it is                                                              |
| ------------------------------ | ----------------------------------------------------------------------- |
| `catalogs/v0.9.1/catalog.json` | the catalog's schema: its components, and the basic catalog's functions |
| `src/catalog.ts`               | the runtime catalog, and each component's props schema by name          |
| `src/components/`              | one folder per component: its schema, its render and its tests          |
| `src/palette.ts`               | the LCH palette generator and its inputs                                |
| `src/provider.tsx`             | the Provider: tokens and typeface on its wrapper                        |
| `src/theme.css`                | the sheet, scoped to the Provider's wrapper, and the font face          |
| `src/fonts/`                   | Inter and its licence                                                   |
| `src/markdown.ts`              | the Markdown renderer                                                   |

## Build and test

```bash
pnpm --filter linear-catalog build
pnpm --filter linear-catalog test
```

A parity test keeps `catalog.json` and the components' props schemas in step, and a surface test renders every surface the Linear agent paints, its knowledge examples and its deterministic answers, through the real A2UI runtime with this catalog.

## Connecting to A2UIVerse

[A2UIVerse](https://github.com/retz8/a2uiverse)'s client installs it straight from this repo, with no registry:

```json
"linear-catalog": "github:retz8/a2uiverse-apps#path:linear/linear-catalog"
```

The client renders every surface carrying `CATALOG_ID` with `CATALOG`, inside `Provider`. Until A2UIVerse installs app bundles, the client also lists the catalog by hand in its catalog map. A2UIVerse puts several apps' catalogs on one page, so its collision tests fail if a catalog's styles escape its wrapper.
