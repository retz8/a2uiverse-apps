import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Timeline.Badge, props-only. The marker on the timeline's
 * connecting line for one entry — a small circle holding an icon, colored by variant.
 *
 * - `child` (required, synthetic <- `children`) -> `ComponentId`: the icon shown inside the badge
 *   circle (typically an `Icon` leaf), per the `TreeView.LeadingVisual` single-visual convention.
 * - `variant` is fixed presentation config -> a plain color-variant enum (no default -> neutral
 *   gray styling).
 *
 * `.strict()` forbids any prop outside this surface. The render-prop `children`, `className`, and
 * the non-`aria-*` `div`-attribute spread have no A2UI representation and are dropped.
 */
export const TimelineBadgeApi = {
  name: 'TimelineBadge',
  schema: z
    .object({
      child: CommonSchemas.ComponentId,
      variant: z
        .enum([
          'accent',
          'success',
          'attention',
          'severe',
          'danger',
          'done',
          'open',
          'closed',
          'sponsors',
        ])
        .optional(),
    })
    .strict(),
} as const;

export type TimelineBadgeProps = z.infer<typeof TimelineBadgeApi.schema>;
