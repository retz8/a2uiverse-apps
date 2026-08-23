import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Timeline.Item, props-only. A single entry on the
 * timeline — a badge on the connecting line plus its body content, with an optional avatar and
 * action controls.
 *
 * - `children` (required) -> `CommonSchemas.ChildList`: the entry's badge and body, plus an
 *   optional avatar and action controls, as Primer composes them.
 * - `condensed` is fixed presentation config -> a plain boolean (default false in `catalog.json`,
 *   never a zod `.default()`): reduced vertical padding and no badge background.
 *
 * `.strict()` forbids any prop outside this surface. `className` and the non-`aria-*`
 * `li`-attribute spread have no A2UI representation and are dropped.
 */
export const TimelineItemApi = {
  name: 'TimelineItem',
  schema: z
    .object({
      children: CommonSchemas.ChildList,
      condensed: z.boolean().optional(),
    })
    .strict(),
} as const;

export type TimelineItemProps = z.infer<typeof TimelineItemApi.schema>;
