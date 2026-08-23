import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `RadioGroup.Validation`, props-only. A validation message
 * shown for the radio group, indicating an error or success state. Part of the `RadioGroup`
 * compound family (6.49) — see `radio-group.md`.
 *
 * Composed as a child of `RadioGroup` (slot-scanned). Raw text content -> synthetic `text` prop
 * (synthetic-content-prop rule: raw text content -> synthetic value prop typed `DynamicString`).
 *
 * - `text` (required, synthetic) -> `DynamicString`: the validation message shown for the group.
 * - `variant` (required) -> a bindable union of the `['error','success']` enum + `DataBinding`
 *   (there is no `DynamicEnum`), mirroring `FormControlValidation.variant`: an agent can drive the
 *   validation status through the data model.
 *
 * No `className`/`id`/`style` on this subcomponent's type — `variant` and the content channel are
 * the whole documented surface. Carries no `Action`. `.strict()` forbids any prop outside it.
 */
export const RadioGroupValidationApi = {
  name: 'RadioGroupValidation',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      variant: z.union([z.enum(['error', 'success']), CommonSchemas.DataBinding]),
    })
    .strict(),
} as const;

export type RadioGroupValidationProps = z.infer<typeof RadioGroupValidationApi.schema>;
