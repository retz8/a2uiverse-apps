import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `FormControl.Validation`, props-only. A validation message
 * shown for the form control, indicating an error or success state. Part of the `FormControl`
 * compound family (6.47) — see `formcontrol.md`.
 *
 * Composed as a child of `FormControl` (slot-scanned). Raw text content -> synthetic `text` prop
 * (synthetic-content-prop rule: raw text content -> synthetic value prop typed `DynamicString`).
 *
 * - `text` (required, synthetic) -> `DynamicString`: the validation message shown for the control.
 * - `variant` (required) -> a bindable union of the `['error','success']` enum + `DataBinding`
 *   (there is no `DynamicEnum`), mirroring `TextInput.validationStatus`: an agent can drive the
 *   validation status through the data model.
 *
 * `id` (association identifier, wired internally by `FormControl`) and `className`/`style` are
 * dropped. Carries no `Action`. `.strict()` forbids any prop outside this surface.
 */
export const FormControlValidationApi = {
  name: 'FormControlValidation',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      variant: z.union([z.enum(['error', 'success']), CommonSchemas.DataBinding]),
    })
    .strict(),
} as const;

export type FormControlValidationProps = z.infer<typeof FormControlValidationApi.schema>;
