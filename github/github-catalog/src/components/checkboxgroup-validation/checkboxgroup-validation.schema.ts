import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `CheckboxGroup.Validation`, props-only. A validation
 * message shown for the checkbox group, indicating an error or success state. Part of the
 * `CheckboxGroup` compound family (6.48) — see `checkbox-group.md`.
 *
 * Composed as a child of `CheckboxGroup` (slot-scanned). Raw text content -> synthetic `text` prop
 * (synthetic-content-prop rule: raw text content -> synthetic value prop typed `DynamicString`).
 *
 * - `text` (required, synthetic) -> `DynamicString`: the validation message shown for the group.
 * - `variant` (required) -> a bindable union of the `['error','success']` enum + `DataBinding`
 *   (there is no `DynamicEnum`), mirroring `FormControl.Validation`: an agent can drive the
 *   validation status through the data model.
 *
 * `className` is dropped (styling passthrough). Carries no `Action`. `.strict()` forbids any prop
 * outside this surface.
 */
export const CheckboxGroupValidationApi = {
  name: 'CheckboxGroupValidation',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      variant: z.union([z.enum(['error', 'success']), CommonSchemas.DataBinding]),
    })
    .strict(),
} as const;

export type CheckboxGroupValidationProps = z.infer<typeof CheckboxGroupValidationApi.schema>;
