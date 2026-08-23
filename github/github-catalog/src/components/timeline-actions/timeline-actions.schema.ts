import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Timeline.Actions, props-only. Action controls displayed
 * with a timeline entry, such as buttons.
 *
 * - `children` (required) -> `CommonSchemas.ChildList`: the action controls shown with the entry,
 *   referenced by id. `Actions` is a positioned wrapper — interactive content inside it (e.g. a
 *   `Button`) brings its own action surface, so the wrapper itself carries no `Action`.
 *
 * `.strict()` forbids any prop outside this surface. `className` and the non-`aria-*`
 * `div`-attribute spread have no A2UI representation and are dropped.
 */
export const TimelineActionsApi = {
  name: 'TimelineActions',
  schema: z
    .object({
      children: CommonSchemas.ChildList,
    })
    .strict(),
} as const;

export type TimelineActionsProps = z.infer<typeof TimelineActionsApi.schema>;
