import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Timeline (the root), props-only. The root of the
 * `Timeline` compound family (6.46): a vertical list of events connected by a line, each entry
 * marked by a badge on the line and carrying its message content.
 *
 * - `children` is the synthetic content channel (required) -> `CommonSchemas.ChildList`; it holds
 *   the timeline's `TimelineItem` and `TimelineBreak` entries in display order, referenced by id
 *   (the permissive ChildList convention shared with Stack / TreeView).
 * - `clipSidebar` is fixed presentation config -> a faithful `boolean | 'start' | 'end' | 'both'`
 *   union (no default); the implementation folds `true` -> `'both'`, so the two render
 *   identically. Both spellings are carried.
 *
 * `.strict()` forbids any prop outside this surface. `className`, the accessibility slice, and the
 * non-`aria-*` `ol`-attribute spread have no A2UI representation and are dropped.
 */
export const TimelineApi = {
  name: 'Timeline',
  schema: z
    .object({
      children: CommonSchemas.ChildList,
      clipSidebar: z.union([z.boolean(), z.enum(['start', 'end', 'both'])]).optional(),
    })
    .strict(),
} as const;

export type TimelineProps = z.infer<typeof TimelineApi.schema>;
