# gmail-catalog

An A2UI catalog for Gmail: Gmail's own components in **Material 3**'s design language, very similar to the product without imitating it. It targets A2UI **v0.9.1** on top of [`@a2ui/react`](https://www.npmjs.com/package/@a2ui/react).

## What's in it

**16 components** and the basic catalog's functions:

| Component        | What it is                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------- |
| `Surface`        | a surface holding one child: a surface-container tier, a corner shape, padding, elevation   |
| `Card`           | an elevated, filled or outlined card holding one child                                      |
| `Stack`          | a column or a row: gap, alignment, wrapping, padding                                        |
| `Divider`        | a hairline, full width or inset                                                             |
| `Text`           | text in a Material 3 type role, with weight, colour role and a line clamp                   |
| `Icon`           | a Material Symbols glyph from the catalog's set, outlined or filled                         |
| `Button`         | a filled, tonal, outlined, text or elevated pill with an optional glyph                     |
| `IconButton`     | a round glyph button; a toggle when `selected` is bound                                     |
| `Chip`           | an assist, filter, input or suggestion chip                                                 |
| `Tag`            | a label's name in a small tinted tag                                                        |
| `Avatar`         | a person's initial in a filled circle                                                       |
| `List`           | rows with optional dividers; `inline` rows run on one line in a wide list, as an inbox's do |
| `ListItem`       | a row: leading, headline, supporting, meta and trailing slots; the whole row its action     |
| `NavigationItem` | a navigation row: glyph, label, count, the active pill                                      |
| `TextField`      | an outlined, filled or plain underlined field, two-way bound                                |
| `Checkbox`       | a two-way checkbox with an optional label                                                   |

The full list, with every property, is [`catalogs/v0.9.1/catalog.json`](catalogs/v0.9.1/catalog.json).

## Using it

```ts
import {CATALOG, CATALOG_ID, Provider} from 'gmail-catalog';
```

- **`CATALOG`**: the components and functions, ready for an A2UI `MessageProcessor`.
- **`CATALOG_ID`**: the catalog's id. A surface created with it renders with this catalog.
- **`Provider`**: Gmail's look. Wrap each surface rendered with this catalog in it; nothing else needs setting up.

The Provider scopes everything to its own wrapper: the token sheet, the component sheet and the typeface. Light or dark follows the OS.

## Look

- **Colour** follows Material 3's own method: tonal palettes from one seed, Google Ecosystem Blue `#4285F4` as the [Firebase brand guidelines](https://firebase.google.com/brand-guidelines) publish it, with TonalSpot's role-to-tone mapping. `scripts/generate-tokens.mjs` writes `src/tokens.css` with [`@material/material-color-utilities`](https://github.com/material-foundation/material-color-utilities).
- **Type, shape, elevation and state layers** are the values m3.material.io publishes.
- **Google Sans** ships with the bundle under the SIL Open Font License 1.1 ([`src/fonts/OFL.txt`](src/fonts/OFL.txt)), declared under the family name `gmail-catalog-sans`.
- **Glyphs** are Material Symbols Outlined (Apache License 2.0) at the 24 px optical size. `scripts/generate-icons.mjs` writes their path data to `src/icons.generated.ts` from google/material-design-icons at a pinned commit. No product icon or logo is drawn.

## Build and test

```bash
pnpm --filter gmail-catalog build
pnpm --filter gmail-catalog test
```

The tests keep the two faces in step (every zod schema against its `catalog.json` entry), keep the sheets scoped to the wrapper, and render every surface the Gmail agent paints — its knowledge examples and its deterministic answers — through the real A2UI runtime.

## Files

| File                           | What it is                                                         |
| ------------------------------ | ------------------------------------------------------------------ |
| `catalogs/v0.9.1/catalog.json` | the catalog document the agent writes against                      |
| `src/catalog.ts`               | assembles `CATALOG`                                                |
| `src/components/<name>/`       | each component's zod schema and React view                         |
| `src/provider.tsx`             | the Provider                                                       |
| `src/tokens.css`               | the Material 3 tokens, generated                                   |
| `src/styles.css`               | the components' sheet and the typeface                             |
| `src/icons.generated.ts`       | the glyphs, generated                                              |
| `scripts/`                     | the token and glyph generators, and the copy of the sheets to dist |

## Connecting to A2UIVerse

[A2UIVerse](https://github.com/retz8/a2uiverse)'s client installs it straight from this repo, with no registry:

```json
"gmail-catalog": "github:retz8/a2uiverse-apps#path:gmail/gmail-catalog"
```

The client renders every surface carrying `CATALOG_ID` with `CATALOG`, inside `Provider`. Until A2UIVerse installs app bundles, the client also lists the catalog by hand in its catalog map. A2UIVerse puts several apps' catalogs on one page, so its collision tests fail if a catalog's styles escape its wrapper.
