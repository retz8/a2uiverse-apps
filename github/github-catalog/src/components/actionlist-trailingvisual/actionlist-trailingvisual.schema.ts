import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer ActionList.TrailingVisual, props-only (component name
 * `ActionList.TrailingVisual`). A visual, typically an icon, counter, or keyboard hint, shown
 * after an item's label. See `_dev/docs/new-components/action-list-trailingvisual.md`.
 *
 * - `children` is the synthetic `ChildList` — the visual content (an `Icon`, `CounterLabel`, or
 *   `KeybindingHint` leaf). The only documented prop.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const ActionListTrailingVisualApi = {
  name: 'ActionList.TrailingVisual',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
    })
    .strict(),
} as const;

export type ActionListTrailingVisualProps = z.infer<typeof ActionListTrailingVisualApi.schema>;
