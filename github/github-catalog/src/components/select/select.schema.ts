import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Select, props-only. The catalog's first form input
 * shipped as a compound family (`Select` + `Select.Option` + `Select.OptGroup`).
 *
 * Faithful translation of Primer Select's real prop surface (resolved from the installed
 * `@primer/react` type declarations and `Select.js`, the authority on what is actually wired):
 * - `children` is the synthetic content channel, typed `CommonSchemas.ChildList` (a static array
 *   of `Select.Option`/`Select.OptGroup` ids, or a `{componentId, path}` dynamic template) —
 *   optional, faithful to Primer's optional `children`. Uses the `ChildList` container-slot
 *   convention established by Stack.
 * - `value` is the selected option's value, two-way bound (the Checkbox/Textarea pattern): the
 *   binder auto-generates a `setValue` setter, and a user's selection writes the new value back
 *   to the bound data-model path. It is REQUIRED — a form input always owns a value.
 * - `placeholder` is the non-selectable leading option shown before any choice -> DynamicString.
 * - `disabled` is bound runtime state -> DynamicBoolean.
 * - `required` is fixed configuration -> plain z.boolean().
 * - `validationStatus`/`size` are Primer enums lifted verbatim -> local z.enum (there is no
 *   DynamicEnum).
 * - `block` is fixed configuration -> plain z.boolean().
 * - `accessibility` supplies the accessible name/description (Select renders no visible label of
 *   its own) -> CommonSchemas.AccessibilityAttributes.
 *
 * Dropped/deferred (no A2UI representation): `defaultValue` (uncontrolled), `onChange` (subsumed
 * by the two-way `value` binding), `monospace` (implementation-dead), `contrast` (omitted from
 * the Select type), `variant`/`width`/`minWidth`/`maxWidth` (deprecated aliases),
 * `className`/`style`/`name`/`id` and the rest of the non-`aria-*` native `<select>` spread.
 * Visible labeling is deferred to FormControl (6.47).
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const SelectApi = {
  name: 'Select',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      value: CommonSchemas.DynamicString,
      placeholder: CommonSchemas.DynamicString.optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
      required: z.boolean().optional(),
      validationStatus: z.enum(['error', 'success']).optional(),
      block: z.boolean().optional(),
      size: z.enum(['small', 'medium', 'large']).optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type SelectProps = z.infer<typeof SelectApi.schema>;
