import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {responsive} from '../../shared/responsive';
import {regionPaddingEnum, responsiveRegionDivider} from '../../shared/page-layout-region';

/**
 * Runtime (zod) representation of Primer `SplitPageLayout.Pane`, props-only. A side panel region
 * beside the main content, optionally resizable by the user; renders inside a `SplitPageLayout`
 * Root.
 *
 * - `children` → `CommonSchemas.ChildList` (optional).
 * - `position` → responsive `z.enum(['start','end'])` (default `"start"`).
 * - `width` → a named size (`small`/`medium`/`large`) or explicit `{min, default, max}` px
 *   constraints (default `"medium"`).
 * - `minWidth` → plain `z.number()` (used with named sizes).
 * - `padding` → plain scalar `z.enum` (default `"normal"`).
 * - `divider` → responsive enum whose narrow arm additionally allows `'filled'` (default `"line"`).
 * - `sticky` → plain `z.boolean()` (default `true`).
 * - `offsetHeader` → `z.union([z.string(), z.number()])` (sticky top offset to clear a fixed header).
 * - `hidden` → `responsive(z.boolean())` (responsive arm deferred, see deferred-catalog-work.md).
 * - `resizable` → plain `z.boolean()` (default `false`).
 * - `currentWidth` → `CommonSchemas.DynamicNumber`, two-way bound: a resize writes the new px width
 *   back to the bound path (the `onResizeEnd` callback is the write-back — the Details-`open` /
 *   Checkbox-`checked` controlled pattern, not a separate prop).
 * - `accessibility` → `CommonSchemas.AccessibilityAttributes` (`label` → `aria-label`).
 *
 * Dropped: `onResizeEnd` (folded into the `currentWidth` two-way binding), `widthStorageKey`
 * (client-runtime localStorage detail, redundant with the bound path), `positionWhenNarrow`/
 * `dividerWhenNarrow` (deprecated aliases), `id`/`aria-labelledby`/`className`/`style`.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const SplitPageLayoutPaneApi = {
  name: 'SplitPageLayout.Pane',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      position: responsive(z.enum(['start', 'end'])).optional(),
      width: z
        .union([
          z.enum(['small', 'medium', 'large']),
          z.object({min: z.string(), default: z.string(), max: z.string()}),
        ])
        .optional(),
      minWidth: z.number().optional(),
      padding: regionPaddingEnum().optional(),
      divider: responsiveRegionDivider().optional(),
      sticky: z.boolean().optional(),
      offsetHeader: z.union([z.string(), z.number()]).optional(),
      hidden: responsive(z.boolean()).optional(),
      resizable: z.boolean().optional(),
      currentWidth: CommonSchemas.DynamicNumber.optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type SplitPageLayoutPaneProps = z.infer<typeof SplitPageLayoutPaneApi.schema>;
