import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer NavList.TrailingVisual, props-only. A visual element, such
 * as an icon or a count, shown after the item's label to convey auxiliary information.
 *
 * - `children` is the synthetic content channel — the visual (an `Icon` or `CounterLabel`) — typed
 *   `CommonSchemas.ChildList` (optional).
 * - `.strict()` forbids any prop outside this surface (the `VisualProps` HTML-`<span>` attribute
 *   spread is dropped).
 */
export const NavListTrailingVisualApi = {
  name: 'NavList.TrailingVisual',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
    })
    .strict(),
} as const;

export type NavListTrailingVisualProps = z.infer<typeof NavListTrailingVisualApi.schema>;
