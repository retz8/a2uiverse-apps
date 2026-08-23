import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `FormControl.LeadingVisual`, props-only. A visual, such as
 * an icon, shown before a checkbox or radio control and its label. Part of the `FormControl`
 * compound family (6.47) — see `formcontrol.md`.
 *
 * Composed as a child of `FormControl` (slot-scanned). Its `children` are a nested component
 * reference (an `Icon`) rather than raw content, so the synthetic content prop is a `ComponentId`
 * (`child`), mirroring `Button.child`.
 *
 * - `child` (required, synthetic <- `children`) -> `ComponentId`: the visual shown before the input.
 *
 * `style` (styling passthrough) is dropped. Carries no `Action`. `.strict()` forbids any prop
 * outside this surface.
 */
export const FormControlLeadingVisualApi = {
  name: 'FormControlLeadingVisual',
  schema: z
    .object({
      child: CommonSchemas.ComponentId,
    })
    .strict(),
} as const;

export type FormControlLeadingVisualProps = z.infer<typeof FormControlLeadingVisualApi.schema>;
