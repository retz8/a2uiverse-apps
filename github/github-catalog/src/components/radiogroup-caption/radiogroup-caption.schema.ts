import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `RadioGroup.Caption`, props-only. Helper text describing
 * the radio group, shown below its label. Part of the `RadioGroup` compound family (6.49) — see
 * `radio-group.md`.
 *
 * Composed as a child of `RadioGroup` (slot-scanned). Raw text content -> synthetic `text` prop
 * (synthetic-content-prop rule: raw text content -> synthetic value prop typed `DynamicString`).
 *
 * - `text` (required, synthetic) -> `DynamicString`: helper text describing the radio group, shown
 *   below its label.
 *
 * `className` is dropped (styling passthrough). Carries no `Action`. `.strict()` forbids any prop
 * outside this surface.
 */
export const RadioGroupCaptionApi = {
  name: 'RadioGroupCaption',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
    })
    .strict(),
} as const;

export type RadioGroupCaptionProps = z.infer<typeof RadioGroupCaptionApi.schema>;
