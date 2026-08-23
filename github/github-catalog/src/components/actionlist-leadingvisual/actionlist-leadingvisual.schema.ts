import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer ActionList.LeadingVisual, props-only (component name
 * `ActionList.LeadingVisual`). A visual, typically an icon, shown before an item's label. See
 * `_dev/docs/new-components/action-list-leadingvisual.md`.
 *
 * - `children` is the synthetic `ChildList` — the visual content (typically an `Icon` leaf). The
 *   only documented prop.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const ActionListLeadingVisualApi = {
  name: 'ActionList.LeadingVisual',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
    })
    .strict(),
} as const;

export type ActionListLeadingVisualProps = z.infer<typeof ActionListLeadingVisualApi.schema>;
