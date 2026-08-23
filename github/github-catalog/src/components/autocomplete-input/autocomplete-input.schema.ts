import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `Autocomplete.Input` (exported as `AutocompleteInput`),
 * props-only. A faithful mirror of `TextInput` (it is `PolymorphicForwardRefComponent<typeof
 * TextInput>`), carrying the same curated subset `textinput.md` locked, with two
 * component-specific decisions and one tightening:
 *
 * - `value` is `carry (optional)` (not required as on `TextInput`): `<Autocomplete.Input />` is
 *   routinely rendered bare, its text managed by the Autocomplete context. It stays two-way bound —
 *   the binder auto-generates `setValue`; the render wires `onChange` to it (when a path is bound,
 *   so the data model observes the typed query for remote filtering / `addNewItem`). Primer's own
 *   Input handler additionally calls `setInputValue` internally to drive local filtering.
 * - `type` is tightened to `z.enum(['text','search'])` (from `TextInput`'s seven) — the only two
 *   types that cohere with a suggestion field (the curated-projection rule).
 * - everything else is lifted verbatim from `TextInput` (see `textinput.md`).
 *
 * Dropped: `as` (polymorphic input-renderer swap), `openOnFocus` (`@deprecated`, removed in v38),
 * `icon`/`variant`/`width`/`minWidth`/`maxWidth` (`@deprecated` aliases), `onChange`/`defaultValue`
 * (subsumed by the two-way binding), `className`/`style`/`name`/`autoFocus`/`onFocus`/`onBlur` and
 * the rest of the non-`aria-*` input-attribute spread.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const AutocompleteInputApi = {
  name: 'Autocomplete.Input',
  schema: z
    .object({
      value: CommonSchemas.DynamicString.optional(),
      placeholder: CommonSchemas.DynamicString.optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
      required: z.boolean().optional(),
      // Bindable enum: a literal 'error'/'success' or a DataBinding {path} (there is no DynamicEnum,
      // so this is a union of the enum + DataBinding), letting an agent drive validation state.
      validationStatus: z
        .union([z.enum(['error', 'success']), CommonSchemas.DataBinding])
        .optional(),
      type: z.enum(['text', 'search']).optional(),
      loading: CommonSchemas.DynamicBoolean.optional(),
      loaderPosition: z.enum(['auto', 'leading', 'trailing']).optional(),
      loaderText: z.string().optional(),
      leadingVisual: CommonSchemas.ComponentId.optional(),
      trailingVisual: CommonSchemas.ComponentId.optional(),
      trailingAction: CommonSchemas.ComponentId.optional(),
      size: z.enum(['small', 'medium', 'large']).optional(),
      block: z.boolean().optional(),
      contrast: z.boolean().optional(),
      monospace: z.boolean().optional(),
      characterLimit: z.number().optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type AutocompleteInputProps = z.infer<typeof AutocompleteInputApi.schema>;
