import {z} from 'zod';

/**
 * Shared local zod types for the `PageLayout` compound family (root + Header / Content / Pane /
 * Sidebar / Footer). Materialized once here and referenced by name from every region leaf, per the
 * family's decision docs (`_dev/docs/new-components/page-layout*.md`).
 */

/**
 * PageLayout's own three-value spacing scale — distinct from Stack's six-value scale. Drives the
 * root `padding`/`rowGap`/`columnGap` and every region's `padding`.
 */
export const spacing = () => z.enum(['none', 'condensed', 'normal']);

/** The page/region width scale: `full` plus three capped sizes. Root `containerWidth`, Content `width`. */
export const sizeWidth = () => z.enum(['full', 'medium', 'large', 'xlarge']);

/**
 * The responsive divider used by Header / Pane / Footer. A scalar `'none' | 'line'`, or a
 * per-viewport map whose `narrow` arm additionally allows a `'filled'` style (the asymmetric arm
 * Primer supports only on narrow). Sidebar's divider is the plain `z.enum(['none','line'])` instead.
 */
export const dividerResponsive = () =>
  z.union([
    z.enum(['none', 'line']),
    z.object({
      narrow: z.enum(['none', 'line', 'filled']).optional(),
      regular: z.enum(['none', 'line']).optional(),
      wide: z.enum(['none', 'line']).optional(),
    }),
  ]);

/**
 * Pane / Sidebar `width`: a named size (`small` | `medium` | `large`) or a custom
 * `{min, default, max}` object of CSS lengths.
 */
export const paneWidth = () =>
  z.union([
    z.enum(['small', 'medium', 'large']),
    z.object({min: z.string(), default: z.string(), max: z.string()}),
  ]);
