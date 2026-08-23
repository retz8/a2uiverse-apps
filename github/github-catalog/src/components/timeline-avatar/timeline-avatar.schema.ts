import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Timeline.Avatar, props-only. An avatar shown beside a
 * timeline entry's badge, identifying the actor of the event.
 *
 * - `child` (required, synthetic <- `children`) -> `ComponentId`: the avatar shown beside the
 *   entry's badge (typically an `Avatar` leaf), per the `TreeView.LeadingVisual` single-visual
 *   convention.
 *
 * `.strict()` forbids any prop outside this surface. `className` and the non-`aria-*`
 * `div`-attribute spread have no A2UI representation and are dropped.
 */
export const TimelineAvatarApi = {
  name: 'TimelineAvatar',
  schema: z
    .object({
      child: CommonSchemas.ComponentId,
    })
    .strict(),
} as const;

export type TimelineAvatarProps = z.infer<typeof TimelineAvatarApi.schema>;
