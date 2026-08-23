import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Select.OptGroup, props-only. The option-group leaf for
 * Select (component name `SelectOptGroup`).
 *
 * - `children` is the synthetic content channel, typed `CommonSchemas.ChildList` (the contained
 *   `Select.Option`s) — optional, faithful to the installed `HTMLOptGroupElement` type. Uses the
 *   `ChildList` container-slot convention established by Stack.
 * - `label` is the group's heading text — `carry (optional)`, typed `DynamicString` so groups can
 *   also be template-generated.
 * - `disabled` is bound runtime state (disables every option in the group) -> DynamicBoolean.
 *
 * Dropped/deferred (no A2UI representation): `id`/`className`/`style` and the rest of the
 * non-`aria-*` `HTMLOptGroupElement` spread. `accessibility` is not carried: a content grouping
 * whose `label` is the accessible name (per-component fidelity).
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const SelectOptGroupApi = {
  name: 'SelectOptGroup',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      label: CommonSchemas.DynamicString.optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
    })
    .strict(),
} as const;

export type SelectOptGroupProps = z.infer<typeof SelectOptGroupApi.schema>;
