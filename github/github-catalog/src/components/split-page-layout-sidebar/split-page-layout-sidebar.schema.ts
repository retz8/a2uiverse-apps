import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {responsive} from '../../shared/responsive';
import {regionPaddingEnum} from '../../shared/page-layout-region';

/**
 * Runtime (zod) representation of Primer `SplitPageLayout.Sidebar`, props-only. A full-height side
 * region running alongside the header, content, and footer, optionally resizable by the user;
 * renders inside a `SplitPageLayout` Root.
 *
 * The installed Sidebar type is newer/cleaner than Pane: `position` and `divider` are scalar (not
 * responsive, no `'filled'`), there is no `offsetHeader` and no deprecated aliases, and it adds
 * `responsiveVariant`.
 *
 * - `children` → `CommonSchemas.ChildList` (optional).
 * - `position` → scalar `z.enum(['start','end'])` (default `"start"`).
 * - `width` → a named size or explicit `{min, default, max}` px constraints (default `"medium"`).
 * - `minWidth` → plain `z.number()` (default `256`).
 * - `resizable` → plain `z.boolean()` (default `false`).
 * - `currentWidth` → `CommonSchemas.DynamicNumber`, two-way bound (resize write-back), per Pane.
 * - `padding` → plain scalar `z.enum` (default `"normal"`).
 * - `divider` → scalar `z.enum(['none','line'])` (default `"line"`).
 * - `sticky` → plain `z.boolean()` (default `false`).
 * - `responsiveVariant` → scalar `z.enum(['default','fullscreen'])` (narrow-viewport behavior;
 *   the `'fullscreen'` effect only shows below the narrow breakpoint — deferred, see
 *   deferred-catalog-work.md).
 * - `hidden` → `responsive(z.boolean())` (responsive arm deferred).
 * - `accessibility` → `CommonSchemas.AccessibilityAttributes` (`label` → `aria-label`).
 *
 * Dropped: `onResizeEnd` (folded into the `currentWidth` two-way binding), `widthStorageKey`
 * (client-runtime localStorage detail), `id`/`aria-labelledby`/`className`/`style`.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const SplitPageLayoutSidebarApi = {
  name: 'SplitPageLayout.Sidebar',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      position: z.enum(['start', 'end']).optional(),
      width: z
        .union([
          z.enum(['small', 'medium', 'large']),
          z.object({min: z.string(), default: z.string(), max: z.string()}),
        ])
        .optional(),
      minWidth: z.number().optional(),
      resizable: z.boolean().optional(),
      currentWidth: CommonSchemas.DynamicNumber.optional(),
      padding: regionPaddingEnum().optional(),
      divider: z.enum(['none', 'line']).optional(),
      sticky: z.boolean().optional(),
      responsiveVariant: z.enum(['default', 'fullscreen']).optional(),
      hidden: responsive(z.boolean()).optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type SplitPageLayoutSidebarProps = z.infer<typeof SplitPageLayoutSidebarApi.schema>;
