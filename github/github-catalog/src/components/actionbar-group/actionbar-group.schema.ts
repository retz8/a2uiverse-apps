import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `ActionBar.Group` (exported as `ActionBarGroup`),
 * props-only (component name `ActionBar.Group`). A presentational grouping container that keeps
 * related toolbar buttons together and collapses them into the overflow menu as a unit.
 *
 * - `children` is the synthetic content channel, typed `CommonSchemas.ChildList` (a static array
 *   of component ids, or a `{componentId, path}` dynamic template) — optional, faithful to
 *   Primer's `children?`. The valid children are `ActionBar.IconButton` and `ActionBar.Divider`.
 *
 * The Primer component has no other author-facing props (only ref/HTML plumbing). `.strict()`
 * forbids any prop outside this surface.
 */
export const ActionBarGroupApi = {
  name: 'ActionBar.Group',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
    })
    .strict(),
} as const;

export type ActionBarGroupProps = z.infer<typeof ActionBarGroupApi.schema>;
