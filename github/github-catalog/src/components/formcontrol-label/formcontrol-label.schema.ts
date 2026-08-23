import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `FormControl.Label`, props-only. The visible label naming
 * the form control it belongs to. Part of the `FormControl` compound family (6.47) — see
 * `formcontrol.md`.
 *
 * Composed as a child of `FormControl` (slot-scanned). Raw text content -> synthetic `text` prop
 * (synthetic-content-prop rule: raw text content -> synthetic value prop typed `DynamicString`).
 *
 * - `text` (required, synthetic) -> `DynamicString`: the visible label text.
 * - `visuallyHidden` -> `z.boolean()` (default `false`, surfaced only in `catalog.json`): hides the
 *   label visually while keeping it available to assistive technologies.
 * - `requiredIndicator` -> `z.boolean()` (default `true`): whether to show the required-field
 *   indicator (asterisk) when the control is required.
 * - `requiredText` -> `z.string()`: custom text conveying the required state to assistive tech.
 *
 * `disabled`/`required` are inherited from the parent `FormControl` (dropped here); `as`,
 * `htmlFor`/`id`, HTML-attribute spread, and `className`/`style` are dropped. Carries no `Action`.
 * `.strict()` forbids any prop outside this surface.
 */
export const FormControlLabelApi = {
  name: 'FormControlLabel',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      visuallyHidden: z.boolean().optional(),
      requiredIndicator: z.boolean().optional(),
      requiredText: z.string().optional(),
    })
    .strict(),
} as const;

export type FormControlLabelProps = z.infer<typeof FormControlLabelApi.schema>;
