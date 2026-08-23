import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {responsive} from '../../shared/responsive';
import {regionPaddingEnum, responsiveRegionDivider} from '../../shared/page-layout-region';

/**
 * Runtime (zod) representation of Primer `SplitPageLayout.Footer`, props-only. The footer region
 * across the bottom of a split page layout; renders inside a `SplitPageLayout` Root. Identical prop
 * shape to `SplitPageLayout.Header`.
 *
 * - `children` → `CommonSchemas.ChildList` (optional).
 * - `padding` → plain scalar `z.enum` (default `"normal"` in catalog.json).
 * - `divider` → responsive enum whose narrow arm additionally allows `'filled'` (default `"line"`).
 * - `hidden` → `responsive(z.boolean())` (responsive arm deferred, see deferred-catalog-work.md).
 * - `accessibility` → `CommonSchemas.AccessibilityAttributes` (`label` → `aria-label`).
 *
 * Dropped: `aria-labelledby` (labeling via `accessibility.label`, per Pagination),
 * `dividerWhenNarrow` (deprecated alias), `className`/`style` (styling passthroughs).
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const SplitPageLayoutFooterApi = {
  name: 'SplitPageLayout.Footer',
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

export type SplitPageLayoutFooterProps = z.infer<typeof SplitPageLayoutFooterApi.schema>;
