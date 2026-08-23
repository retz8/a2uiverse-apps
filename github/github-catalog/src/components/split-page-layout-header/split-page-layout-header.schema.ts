import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {responsive} from '../../shared/responsive';
import {regionPaddingEnum, responsiveRegionDivider} from '../../shared/page-layout-region';

/**
 * Runtime (zod) representation of Primer `SplitPageLayout.Header`, props-only. The banner region
 * across the top of a split page layout; renders inside a `SplitPageLayout` Root.
 *
 * - `children` is the synthetic content channel → `CommonSchemas.ChildList` (optional), like every
 *   region.
 * - `padding` is fixed visual config → a plain scalar `z.enum` (default `"normal"` in catalog.json).
 * - `divider` is Primer's `ResponsiveValue`-bearing edge divider → the responsive enum whose narrow
 *   arm additionally allows `'filled'` (default `"line"`).
 * - `hidden` is `responsive(z.boolean())` (the responsive arm only shows across viewport widths —
 *   deferred, see `_dev/docs/deferred-catalog-work.md`).
 * - `accessibility` labels the header landmark → `CommonSchemas.AccessibilityAttributes`
 *   (`label` → `aria-label`).
 *
 * Dropped: `aria-labelledby` (DOM id-reference; labeling via `accessibility.label`, per Pagination),
 * `dividerWhenNarrow` (deprecated alias), `className`/`style` (styling passthroughs).
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const SplitPageLayoutHeaderApi = {
  name: 'SplitPageLayout.Header',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      padding: regionPaddingEnum().optional(),
      divider: responsiveRegionDivider().optional(),
      hidden: responsive(z.boolean()).optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type SplitPageLayoutHeaderProps = z.infer<typeof SplitPageLayoutHeaderApi.schema>;
