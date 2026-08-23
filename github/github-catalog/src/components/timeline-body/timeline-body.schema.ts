import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Timeline.Body, props-only. The message content of a
 * timeline entry, shown beside its badge.
 *
 * - `children` (required) -> `CommonSchemas.ChildList`: the entry's message content, referenced by
 *   id (the permissive ChildList convention shared with Stack / TreeView).
 *
 * `.strict()` forbids any prop outside this surface. `className` and the non-`aria-*`
 * `div`-attribute spread have no A2UI representation and are dropped.
 */
export const TimelineBodyApi = {
  name: 'TimelineBody',
  schema: z
    .object({
      children: CommonSchemas.ChildList,
    })
    .strict(),
} as const;

export type TimelineBodyProps = z.infer<typeof TimelineBodyApi.schema>;
