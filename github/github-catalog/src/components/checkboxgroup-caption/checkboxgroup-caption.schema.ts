import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `CheckboxGroup.Caption`, props-only. Helper text describing
 * the group of checkboxes, shown below its label. Part of the `CheckboxGroup` compound family
 * (6.48) — see `checkbox-group.md`.
 *
 * Composed as a child of `CheckboxGroup` (slot-scanned). Raw text content -> synthetic `text` prop
 * (synthetic-content-prop rule: raw text content -> synthetic value prop typed `DynamicString`).
 *
 * - `text` (required, synthetic) -> `DynamicString`: helper text describing the group, shown below
 *   the label.
 *
 * `className` is dropped (styling passthrough). Carries no `Action`. `.strict()` forbids any prop
 * outside this surface.
 */
export const CheckboxGroupCaptionApi = {
  name: 'CheckboxGroupCaption',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
    })
    .strict(),
} as const;

export type CheckboxGroupCaptionProps = z.infer<typeof CheckboxGroupCaptionApi.schema>;
