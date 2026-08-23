import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer ActionList.Description, props-only (component name
 * `ActionList.Description`). Secondary text describing an item, shown beside or below the item's
 * label. See `_dev/docs/new-components/action-list-description.md`.
 *
 * - `text` is the synthetic content channel (Primer takes content via React children, but A2UI
 *   children are component ids, so raw content needs a value prop) -> `DynamicString`, required.
 * - `variant` selects inline (beside) vs block (below); `truncate` truncates an inline
 *   description on overflow -> plain boolean. Defaults live in `catalog.json`.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const ActionListDescriptionApi = {
  name: 'ActionList.Description',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      variant: z.enum(['inline', 'block']).optional(),
      truncate: z.boolean().optional(),
    })
    .strict(),
} as const;

export type ActionListDescriptionProps = z.infer<typeof ActionListDescriptionApi.schema>;
