import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `FormControl.Caption`, props-only. Helper text describing
 * the form control, shown below its label. Part of the `FormControl` compound family (6.47) — see
 * `formcontrol.md`.
 *
 * Composed as a child of `FormControl` (slot-scanned). Raw text content -> synthetic `text` prop
 * (synthetic-content-prop rule: raw text content -> synthetic value prop typed `DynamicString`).
 *
 * - `text` (required, synthetic) -> `DynamicString`: helper text shown below the label.
 *
 * `id` (association identifier, wired internally by `FormControl`) and `className`/`style` are
 * dropped. Carries no `Action`. `.strict()` forbids any prop outside this surface.
 */
export const FormControlCaptionApi = {
  name: 'FormControlCaption',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
    })
    .strict(),
} as const;

export type FormControlCaptionProps = z.infer<typeof FormControlCaptionApi.schema>;
