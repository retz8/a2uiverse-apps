import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {responsive} from '../../shared/responsive.js';
import {regionPaddingEnum} from '../../shared/page-layout-region.js';

/**
 * Runtime (zod) representation of Primer `SplitPageLayout.Content`, props-only. The main content
 * region of a split page layout; renders inside a `SplitPageLayout` Root. Content has no `divider`;
 * it adds `as` (the main-landmark element) and `width` (max content width).
 *
 * - `children` → `CommonSchemas.ChildList` (optional).
 * - `as` → curated `z.enum` of display-equivalent landmark tags (default `"main"`), per the Stack
 *   precedent — the choices differ only in semantic/landmark identity.
 * - `width` → scalar `z.enum` (default `"large"`; not responsive in the installed type).
 * - `padding` → plain scalar `z.enum` (default `"normal"`).
 * - `hidden` → `responsive(z.boolean())` (responsive arm deferred, see deferred-catalog-work.md).
 * - `accessibility` → `CommonSchemas.AccessibilityAttributes` (`label` → `aria-label`).
 *
 * Dropped: `aria-labelledby` (labeling via `accessibility.label`, per Pagination),
 * `className`/`style` (styling passthroughs).
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const SplitPageLayoutContentApi = {
  name: 'SplitPageLayout.Content',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      as: z.enum(['main', 'div', 'section', 'article']).optional(),
      width: z.enum(['full', 'medium', 'large', 'xlarge']).optional(),
      padding: regionPaddingEnum().optional(),
      hidden: responsive(z.boolean()).optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type SplitPageLayoutContentProps = z.infer<typeof SplitPageLayoutContentApi.schema>;
