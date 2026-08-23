import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `CheckboxGroup` (the root of the compound family, 6.48),
 * props-only. Groups a set of related checkboxes under a shared label, optional helper caption, and
 * optional validation message, laying them out and associating them for assistive technologies.
 *
 * No new infra: CheckboxGroup renders through the normal adapter->renderer path. Its `children` are
 * slot-scanned exactly as `FormControl`'s and `Dialog`'s are (`CommonSchemas.ChildList`) — the
 * renderer passes the real Primer subcomponents (`CheckboxGroup.Label` / `.Caption` / `.Validation`)
 * and the checkbox inputs through as children, and Primer's own `useSlots` does the
 * label/caption/validation association and layout. See `checkbox-group.md`.
 *
 * - `children` (required) -> `ChildList`: the group label, an optional caption / validation message,
 *   and the checkbox inputs.
 * - `disabled` -> `DynamicBoolean`: whether the whole group is inactive and its checkboxes cannot be
 *   toggled.
 * - `required` -> fixed authoring-time config (`z.boolean()`), matching the sibling
 *   `FormControl.required`: whether a selection is required before the form can be submitted (ARIA
 *   only, no visible indicator).
 *
 * Dropped/deferred: `onChange` (represented by the two-way `checked` binding on each child
 * `Checkbox` — the group's selected set is derivable from those paths); `id` (framework-owned
 * envelope field consumed as the component's identity, so it can never reach the props object, per
 * `catalog.parity.test.ts`; association still works via the group's `id` fallback);
 * `aria-labelledby` (association identifier — labeling is done by `CheckboxGroup.Label`);
 * `className`/`data-component` (styling / test-hook passthroughs).
 *
 * The whole family emits no `Action`/event — it is a pure grouping wrapper; selection state lives in
 * each child `Checkbox`'s two-way `checked` binding. `.strict()` forbids any prop outside this
 * surface.
 */
export const CheckboxGroupApi = {
  name: 'CheckboxGroup',
  schema: z
    .object({
      children: CommonSchemas.ChildList,
      disabled: CommonSchemas.DynamicBoolean.optional(),
      required: z.boolean().optional(),
    })
    .strict(),
} as const;

export type CheckboxGroupProps = z.infer<typeof CheckboxGroupApi.schema>;
