import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Truncate, props-only.
 *
 * - `text` is the synthetic content prop (Primer Truncate takes content via React
 *   children, but A2UI children are component IDs, so content needs a value prop). Both
 *   `text` and `title` are `DynamicString` so an agent can data-bind them.
 * - `title` is the accessibility channel — the full untruncated text exposed to assistive
 *   technologies and shown on hover — carried separately from `text`, not a duplicate of
 *   the rendered content.
 * - `inline`/`expandable` are fixed authoring-time toggles (plain booleans, not
 *   `Dynamic*`): inline lays the text out as inline-block; expandable reveals the full
 *   text on hover.
 * - `maxWidth` is a fixed CSS width string (the raw pixel-number arm is not projected — a
 *   width string expresses every case; SkeletonBox precedent).
 * - `as` is Primer's polymorphic host element narrowed to the display-equivalent wrappers.
 * - `.strict()` forbids any prop outside this surface.
 */
export const TruncateApi = {
  name: 'Truncate',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      title: CommonSchemas.DynamicString,
      inline: z.boolean().optional(),
      expandable: z.boolean().optional(),
      maxWidth: z.string().optional(),
      as: z.enum(['div', 'span', 'p']).optional(),
    })
    .strict(),
} as const;

export type TruncateProps = z.infer<typeof TruncateApi.schema>;
