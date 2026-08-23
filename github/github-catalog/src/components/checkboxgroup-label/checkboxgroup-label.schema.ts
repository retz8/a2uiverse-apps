import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `CheckboxGroup.Label`, props-only. The visible label
 * (fieldset legend) naming the group of checkboxes it belongs to. Part of the `CheckboxGroup`
 * compound family (6.48) — see `checkbox-group.md`.
 *
 * Simpler than `FormControl.Label`: this type has no `requiredIndicator` / `requiredText` / `as`.
 *
 * Composed as a child of `CheckboxGroup` (slot-scanned). Raw text content -> synthetic `text` prop
 * (synthetic-content-prop rule: raw text content -> synthetic value prop typed `DynamicString`).
 *
 * - `text` (required, synthetic) -> `DynamicString`: the visible label naming the group of
 *   checkboxes.
 * - `visuallyHidden` -> `z.boolean()` (default `false`, surfaced only in `catalog.json`): hides the
 *   label visually while keeping it available to assistive technologies.
 *
 * `className` is dropped (styling passthrough). Carries no `Action`. `.strict()` forbids any prop
 * outside this surface.
 */
export const CheckboxGroupLabelApi = {
  name: 'CheckboxGroupLabel',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      visuallyHidden: z.boolean().optional(),
    })
    .strict(),
} as const;

export type CheckboxGroupLabelProps = z.infer<typeof CheckboxGroupLabelApi.schema>;
