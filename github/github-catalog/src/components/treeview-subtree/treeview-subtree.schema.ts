import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer TreeView.SubTree, props-only. The nested group of items
 * revealed when a tree item is expanded, with loading and error states for asynchronously-loaded
 * contents.
 *
 * - `children` (optional) -> `ChildList`: the nested tree items revealed on expansion.
 * - `state` is the load state -> a local `z.enum` (`initial|loading|done|error`); it drives the
 *   loading-skeleton and error affordances.
 * - `count` is the skeleton-row count shown while loading -> plain number.
 * - `accessibility` maps `aria-label` -> `CommonSchemas.AccessibilityAttributes`.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const TreeViewSubTreeApi = {
  name: 'TreeViewSubTree',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      state: z.enum(['initial', 'loading', 'done', 'error']).optional(),
      count: z.number().optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type TreeViewSubTreeProps = z.infer<typeof TreeViewSubTreeApi.schema>;
