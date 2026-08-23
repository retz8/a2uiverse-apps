import {z} from 'zod';

/**
 * Runtime (zod) representation of Primer Timeline.Break, props-only. A decorative separator
 * marking a break between groups of timeline entries.
 *
 * An empty decorative leaf — the separator renders `role="presentation"` and is not conveyed to
 * assistive technologies, so it carries no props: its `children` would be hidden, and `className` /
 * the non-`aria-*` `li`-attribute spread have no A2UI representation. The schema is the empty
 * object; `.strict()` forbids any prop.
 */
export const TimelineBreakApi = {
  name: 'TimelineBreak',
  schema: z.object({}).strict(),
} as const;

export type TimelineBreakProps = z.infer<typeof TimelineBreakApi.schema>;
