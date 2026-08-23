import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer NavList.LeadingVisual, props-only. A visual element, such
 * as an icon, shown before the item's label.
 *
 * - `children` is the synthetic content channel — the visual (an `Icon`) — typed
 *   `CommonSchemas.ChildList` (optional).
 * - `.strict()` forbids any prop outside this surface (the `VisualProps` HTML-`<span>` attribute
 *   spread is dropped).
 */
export const NavListLeadingVisualApi = {
  name: 'NavList.LeadingVisual',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
    })
    .strict(),
} as const;

export type NavListLeadingVisualProps = z.infer<typeof NavListLeadingVisualApi.schema>;
