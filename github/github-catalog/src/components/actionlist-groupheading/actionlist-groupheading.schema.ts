import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer ActionList.GroupHeading, props-only (component name
 * `ActionList.GroupHeading`). A heading labeling a group of items, optionally with a trailing
 * action beside the label. See `_dev/docs/new-components/action-list-groupheading.md`.
 *
 * Unlike the list-level `Heading` (a content leaf), a group heading is a container: its `children`
 * is a permissive `ChildList` holding the heading label (a `Text` leaf) and an optional trailing
 * action (the `ActionList.TrailingAction` leaf).
 *
 * - `variant` is a Primer enum lifted verbatim; `auxiliaryText` is a bound display value ->
 *   `DynamicString`; `visuallyHidden` is fixed configuration -> plain boolean; `as` selects the
 *   heading level. Defaults live in `catalog.json`, never as zod `.default()`.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const ActionListGroupHeadingApi = {
  name: 'ActionList.GroupHeading',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      variant: z.enum(['filled', 'subtle']).optional(),
      auxiliaryText: CommonSchemas.DynamicString.optional(),
      visuallyHidden: z.boolean().optional(),
      as: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']).optional(),
    })
    .strict(),
} as const;

export type ActionListGroupHeadingProps = z.infer<typeof ActionListGroupHeadingApi.schema>;
