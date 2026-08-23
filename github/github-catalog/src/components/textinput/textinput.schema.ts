import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer TextInput, props-only.
 *
 * Faithful translation of Primer TextInput's real prop surface (resolved from the installed
 * `@primer/react` type declarations, not the stale doc):
 * - `value` is the single-line text content, two-way bound (the Checkbox/Textarea pattern): the
 *   binder auto-generates a `setValue` setter, and user edits write back to the bound data-model
 *   path. It is REQUIRED — a text input always owns a value.
 * - `placeholder` is the empty-state hint (the one carried native-attribute exception, a content
 *   channel central to a text input) -> DynamicString.
 * - `disabled`/`loading` are bound runtime state -> DynamicBoolean.
 * - `required`/`block`/`contrast`/`monospace` are fixed configuration -> plain z.boolean().
 * - `validationStatus` is a bindable enum: an agent can drive the validation state through the
 *   data model, so it is a union of the `['error','success']` enum + DataBinding (there is no
 *   DynamicEnum). `type`/`loaderPosition`/`size` are Primer enums lifted verbatim -> local
 *   z.enum. Defaults (`type: 'text'`, `loaderPosition: 'auto'`) surface only in catalog.json,
 *   not as .default().
 * - `loaderText` is fixed screen-reader configuration -> plain z.string(); `characterLimit` is
 *   fixed sizing configuration -> plain z.number().
 * - `leadingVisual`/`trailingVisual`/`trailingAction` are Primer's element-typed slots; the
 *   faithful A2UI translation of an element slot is a ComponentId child. `trailingAction`
 *   references a `TextInput.Action` (shipped as a sibling leaf in the same 6.30 sub-task).
 * - `accessibility` supplies the accessible name/description (TextInput renders no visible label
 *   of its own) -> CommonSchemas.AccessibilityAttributes.
 *
 * Dropped/deferred (no A2UI representation): `icon`/`variant`/`width`/`minWidth`/`maxWidth`
 * (@deprecated aliases), `onChange` (subsumed by the two-way `value` binding), `defaultValue`,
 * `className`/`style`, `ref` and the non-`aria-*` input-attribute spread. Visible labeling is
 * deferred to FormControl (6.47).
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const TextInputApi = {
  name: 'TextInput',
  schema: z
    .object({
      value: CommonSchemas.DynamicString,
      placeholder: CommonSchemas.DynamicString.optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
      required: z.boolean().optional(),
      // Bindable enum: a literal 'error'/'success' or a DataBinding {path} the binder resolves
      // and subscribes to (there is no DynamicEnum, so this is a union of the enum + DataBinding).
      // Lets an agent drive the validation state through the data model (e.g. a search round-trip
      // writing /validation → 'success' turns the field green).
      validationStatus: z
        .union([z.enum(['error', 'success']), CommonSchemas.DataBinding])
        .optional(),
      type: z.enum(['text', 'password', 'email', 'number', 'search', 'tel', 'url']).optional(),
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

export type TextInputProps = z.infer<typeof TextInputApi.schema>;
