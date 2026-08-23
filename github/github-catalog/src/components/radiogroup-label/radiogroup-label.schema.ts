import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `RadioGroup.Label`, props-only. The visible label
 * (fieldset legend) naming the radio group it belongs to. Part of the `RadioGroup` compound family
 * (6.49) — see `radio-group.md`.
 *
 * Composed as a child of `RadioGroup` (slot-scanned). Raw text content -> synthetic `text` prop
 * (synthetic-content-prop rule: raw text content -> synthetic value prop typed `DynamicString`).
 *
 * - `text` (required, synthetic) -> `DynamicString`: the visible label naming the radio group.
 * - `visuallyHidden` -> `z.boolean()` (default `false`, surfaced only in `catalog.json`): hides the
 *   label visually while keeping it available to assistive technologies.
 *
 * `className` is dropped (styling passthrough). Carries no `Action`. `.strict()` forbids any prop
 * outside this surface.
 */
export const RadioGroupLabelApi = {
  name: 'RadioGroupLabel',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      visuallyHidden: z.boolean().optional(),
    })
    .strict(),
} as const;

export type RadioGroupLabelProps = z.infer<typeof RadioGroupLabelApi.schema>;
