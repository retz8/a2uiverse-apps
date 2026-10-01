# calendar-catalog

An A2UI catalog for Google Calendar: Calendar's own components in **Material 3**'s design language, very similar to the product without imitating it. It targets A2UI **v0.9.1** on top of [`@a2ui/react`](https://www.npmjs.com/package/@a2ui/react).

## What's in it

**15 components** and the basic catalog's functions:

| Component     | What it is                                                                                    |
| ------------- | --------------------------------------------------------------------------------------------- |
| `Surface`     | a surface holding one child: a surface-container tier, a corner shape, padding, elevation     |
| `Card`        | an elevated, filled or outlined card holding one child                                        |
| `Stack`       | a column or a row: gap, alignment, wrapping, padding                                          |
| `Divider`     | a hairline, full width or inset                                                               |
| `Text`        | text in a Material 3 type role, with weight, colour role and a line clamp                     |
| `Icon`        | a Material Symbols glyph from the catalog's set, outlined or filled                           |
| `Button`      | a filled, tonal, outlined, text or elevated pill with an optional glyph                       |
| `IconButton`  | a round glyph button; a toggle when `selected` is bound                                       |
| `Chip`        | an assist, filter, input or suggestion chip                                                   |
| `ColorSwatch` | an event's colour: a rounded square beside a title, or a dot in a row                         |
| `Avatar`      | a person's initial in a filled circle, with a badge for their answer to an invitation         |
| `List`        | rows with optional dividers; `inline` rows run on one line in a wide list, as a schedule's do |
| `ListItem`    | a row: leading, headline, supporting, meta and trailing slots; the whole row its action       |
| `TextField`   | an outlined, filled or plain underlined field, a title's size when `large`; two-way bound     |
| `Checkbox`    | a two-way checkbox with an optional label, in the primary colour or a calendar's colour       |

The full list, with every property, is [`catalogs/v0.9.1/catalog.json`](catalogs/v0.9.1/catalog.json).

## Using it

```ts
import {CATALOG, CATALOG_ID, Provider} from 'calendar-catalog';
```

- **`CATALOG`**: the components and functions, ready for an A2UI `MessageProcessor`.
- **`CATALOG_ID`**: the catalog's id. A surface created with it renders with this catalog.
- **`Provider`**: Calendar's look. Wrap each surface rendered with this catalog in it; nothing else needs setting up.

The Provider scopes everything to its own wrapper: the token sheet, the component sheet and the typeface. Light or dark follows the OS.

## Look

- **Colour** follows Material 3's own method: tonal palettes from one seed, Google Ecosystem Blue `#4285F4` as the [Firebase brand guidelines](https://firebase.google.com/brand-guidelines) publish it, with TonalSpot's role-to-tone mapping. `scripts/generate-tokens.mjs` writes `src/tokens.css` with [`@material/material-color-utilities`](https://github.com/material-foundation/material-color-utilities).
- **Event colours** are the 11 the Calendar API publishes (`colors.get`), named as the Calendar UI names them — Lavender to Tomato. Each keeps its hue and chroma, set at a tone that carries white text in the light theme and a light tone under dark text in the dark one.
- **Type, shape, elevation and state layers** are the values m3.material.io publishes.
- **Google Sans** ships with the bundle under the SIL Open Font License 1.1 ([`src/fonts/OFL.txt`](src/fonts/OFL.txt)), declared under the family name `calendar-catalog-sans`.
- **Glyphs** are Material Symbols Outlined (Apache License 2.0) at the 24 px optical size. `scripts/generate-icons.mjs` writes their path data to `src/icons.generated.ts` from google/material-design-icons at a pinned commit. No product icon or logo is drawn.

## Build and test

```bash
pnpm --filter calendar-catalog build
pnpm --filter calendar-catalog test
pnpm --filter calendar-catalog check
```

`check` packs the built package with Stellify in memory and runs the gate A2UIVerse runs when it installs the app; it writes nothing.

The tests keep the two faces in step (every zod schema against its `catalog.json` entry), keep the sheets scoped to the wrapper, and render every surface the Calendar agent paints — its knowledge examples and its deterministic answers — through the real A2UI runtime.

## Files

| File                           | What it is                                                         |
| ------------------------------ | ------------------------------------------------------------------ |
| `catalogs/v0.9.1/catalog.json` | the catalog document the agent writes against                      |
| `src/catalog.ts`               | assembles `CATALOG`                                                |
| `src/components/<name>/`       | each component's zod schema and React view                         |
| `src/provider.tsx`             | the Provider                                                       |
| `src/tokens.css`               | the Material 3 tokens and event colours, generated                 |
| `src/styles.css`               | the components' sheet and the typeface                             |
| `src/icons.generated.ts`       | the glyphs, generated                                              |
| `scripts/`                     | the token and glyph generators, and the copy of the sheets to dist |

## Connecting to A2UIVerse

[A2UIVerse](https://github.com/retz8/a2uiverse) compiles no catalog in. Its pack tool, [Stellify](https://github.com/retz8/a2uiverse/tree/main/packages/stellify), this package's one dev dependency on the platform, packs the built package into a catalog artifact, and the app is installed with it. A2UIVerse's client loads the artifact at runtime and renders every surface in this catalog with `CATALOG`, inside `Provider`. A2UIVerse puts several apps' catalogs on one page, so its collision detector flags a catalog whose styles escape its wrapper.
