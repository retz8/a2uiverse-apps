import {z} from 'zod';

/**
 * Schema helpers shared by the `SplitPageLayout` region leaves (`Header`, `Content`, `Pane`,
 * `Sidebar`, `Footer`). Every region reuses the same Primer `PageLayout*Props` types, so their
 * common prop arms live here rather than being re-authored per leaf.
 */

/** Primer's three-step region padding scale, shared by all five regions. */
export const regionPaddingEnum = () => z.enum(['none', 'condensed', 'normal']);

/**
 * The divider drawn along a region's edge. Primer's Header/Footer/Pane types carry this as a
 * `ResponsiveValue`: the scalar arm is `['none','line']`, while the narrow arm additionally allows
 * `'filled'` (a full-bleed narrow-viewport divider). Carried faithfully — the responsive object
 * and the narrow-only `'filled'` value only surface across viewport widths (see
 * `_dev/docs/deferred-catalog-work.md`). Sidebar's newer type is scalar-only and does not use this.
 */
export const responsiveRegionDivider = () =>
  z.union([
    z.enum(['none', 'line']),
    z.object({
      narrow: z.enum(['none', 'line', 'filled']).optional(),
      regular: z.enum(['none', 'line']).optional(),
      wide: z.enum(['none', 'line']).optional(),
    }),
  ]);
