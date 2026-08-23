import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Textarea, props-only.
 *
 * Faithful translation of Primer Textarea's real prop surface (resolved from the installed
 * `@primer/react` type declarations, not the stale doc):
 * - `value` is the multiline text content, two-way bound (the Checkbox pattern): the binder
 *   auto-generates a `setValue` setter, and user edits write back to the bound data-model
 *   path. It is REQUIRED — a text input always owns a value.
 * - `placeholder` is the empty-state hint (the one carried native-attribute exception, a
 *   content channel central to a text input) -> DynamicString.
 * - `disabled` is bound runtime state -> DynamicBoolean.
 * - `required`/`block`/`contrast` are fixed configuration -> plain z.boolean().
 * - `validationStatus`/`resize` are Primer enums lifted verbatim -> local z.enum (there is no
 *   DynamicEnum). Defaults (`resize: 'both'`) surface only in catalog.json, not as .default().
 * - `rows`/`cols`/`characterLimit`/`minHeight`/`maxHeight` are fixed sizing configuration ->
 *   plain z.number().
 * - `accessibility` supplies the accessible name/description (Textarea renders no visible label
 *   of its own) -> CommonSchemas.AccessibilityAttributes.
 *
 * Dropped/deferred (no A2UI representation): `onChange` (subsumed by the two-way `value`
 * binding), `defaultValue`, `as` (doc-stale), `className`/`style`, `ref` and the non-`aria-*`
 * textarea-attribute spread. Visible labeling is deferred to FormControl (6.47).
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const TextareaApi = {
  name: 'Textarea',
  schema: z
    .object({
      value: CommonSchemas.DynamicString,
      placeholder: CommonSchemas.DynamicString.optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
      required: z.boolean().optional(),
      validationStatus: z.enum(['error', 'success']).optional(),
      block: z.boolean().optional(),
      resize: z.enum(['none', 'both', 'horizontal', 'vertical']).optional(),
      contrast: z.boolean().optional(),
      rows: z.number().optional(),
      cols: z.number().optional(),
      characterLimit: z.number().optional(),
      minHeight: z.number().optional(),
      maxHeight: z.number().optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type TextareaProps = z.infer<typeof TextareaApi.schema>;
