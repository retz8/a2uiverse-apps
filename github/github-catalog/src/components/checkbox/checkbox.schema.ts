import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Checkbox, props-only.
 *
 * First true INPUT component in the catalog: `checked` is two-way bound. The generic binder
 * auto-generates a `setChecked(value: boolean)` setter from the `DynamicBoolean` prop (see
 * GenerateSetters in @a2ui/web_core generic-binder); the render wires the user's toggle back to
 * the bound data-model path through it. No new infrastructure and no `Action` — the state change
 * *is* the write-back, so there is no client→server message and no local function.
 *
 * Faithful 1:1 translation of Primer Checkbox's real prop surface:
 * - `checked` is the bound runtime state (required) -> DynamicBoolean.
 * - `indeterminate`/`disabled` are bound runtime state -> DynamicBoolean; while `indeterminate`
 *   is set Primer overrides the checked appearance and conveys "mixed" to assistive tech.
 * - `required` is fixed configuration -> plain boolean; mirrored to aria-required.
 * - `validationStatus` is an ARIA-only enum lifted verbatim (an individual checkbox has no
 *   validation styles).
 * - `value` is the hidden form-submission identity -> plain string.
 * - `accessibility` is carried because Checkbox spreads InputHTMLAttributes (the aria-* slice);
 *   it maps to CommonSchemas.AccessibilityAttributes — the checkbox renders no visible label.
 *
 * Dropped/deferred: `onChange` (represented by the two-way binding on `checked`),
 * `defaultChecked` (the data model owns state), `as` (doc-stale; renders `<input>`
 * unconditionally), `ref`/`data-component`/non-aria input-attribute spread.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const CheckboxApi = {
  name: 'Checkbox',
  schema: z
    .object({
      checked: CommonSchemas.DynamicBoolean,
      indeterminate: CommonSchemas.DynamicBoolean.optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
      required: z.boolean().optional(),
      validationStatus: z.enum(['error', 'success']).optional(),
      value: z.string().optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type CheckboxProps = z.infer<typeof CheckboxApi.schema>;
