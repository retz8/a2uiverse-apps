import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer TreeView (the root), props-only. The root of the
 * `TreeView` compound family (6.45): a hierarchical list of items that expand and collapse to
 * reveal nested items.
 *
 * - `children` is the synthetic content channel (required) -> `CommonSchemas.ChildList`; it holds
 *   the tree's `TreeViewItem` rows, referenced by id (the permissive ChildList convention shared
 *   with Stack / ActionList).
 * - `flat`/`truncate` are fixed presentation config -> plain booleans. Defaults (`flat: false`,
 *   `truncate: true`, from `TreeView.js:70`) live in `catalog.json`, never as a zod `.default()`.
 * - `accessibility` maps `aria-label` -> `CommonSchemas.AccessibilityAttributes`.
 *
 * `.strict()` forbids any prop outside this surface. `className`/`style` are styling
 * passthroughs with no A2UI representation and are dropped.
 */
export const TreeViewApi = {
  name: 'TreeView',
  schema: z
    .object({
      children: CommonSchemas.ChildList,
      flat: z.boolean().optional(),
      truncate: z.boolean().optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type TreeViewProps = z.infer<typeof TreeViewApi.schema>;
