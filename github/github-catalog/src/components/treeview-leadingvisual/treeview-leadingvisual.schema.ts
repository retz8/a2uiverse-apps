import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer TreeView.LeadingVisual, props-only. An icon shown before
 * a tree item's label.
 *
 * - `child` (required, synthetic <- `children`) -> `ComponentId`: the icon shown before the label.
 *   Primer's render-prop `children` form (`(props: {isExpanded}) => ReactNode`) is not
 *   JSON-serializable and is dropped; a static icon reference is carried instead.
 * - `label` is a plain-string accessible label for the visual.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const TreeViewLeadingVisualApi = {
  name: 'TreeViewLeadingVisual',
  schema: z
    .object({
      child: CommonSchemas.ComponentId,
      label: z.string().optional(),
    })
    .strict(),
} as const;

export type TreeViewLeadingVisualProps = z.infer<typeof TreeViewLeadingVisualApi.schema>;
