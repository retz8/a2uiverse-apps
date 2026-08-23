import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer LabelGroup, props-only. A pure presentational container
 * that groups a set of labels/tokens, optionally truncating the group to a maximum number of
 * visible items with the remainder revealed on demand.
 *
 * - `children` is the synthetic content channel, typed `CommonSchemas.ChildList` (a static array
 *   of component ids, or a `{componentId, path}` dynamic template) — optional, faithful to
 *   Primer's optional `children` (an empty group is legal).
 * - `overflowStyle` and `as` are curated enums; their defaults (`overlay` / `ul`, from Primer's
 *   installed code) live in `catalog.json`, never as a zod `.default()`.
 * - `visibleChildCount` carries the full `'auto' | number` union, the numeric arm tightened to a
 *   positive integer (every value it rejects is one Primer cannot meaningfully use).
 * - `.strict()` forbids any prop outside this surface.
 */
export const LabelGroupApi = {
  name: 'LabelGroup',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      overflowStyle: z.enum(['inline', 'overlay']).optional(),
      visibleChildCount: z.union([z.literal('auto'), z.number().int().positive()]).optional(),
      as: z.enum(['ul', 'ol', 'div', 'span']).optional(),
    })
    .strict(),
} as const;

export type LabelGroupProps = z.infer<typeof LabelGroupApi.schema>;
