import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer ActionBar, props-only. A horizontal toolbar of icon
 * buttons, optionally separated into groups by dividers; buttons that don't fit the available
 * width collapse into an overflow menu (Primer-internal measured behavior — no catalog overlay
 * infra).
 *
 * - `children` is the synthetic content channel, typed `CommonSchemas.ChildList` (a static array
 *   of component ids, or a `{componentId, path}` dynamic template) — REQUIRED, faithful to
 *   Primer's required `children` (an empty toolbar is not meaningful). The valid children are the
 *   four sibling leaves: `ActionBar.IconButton`, `ActionBar.Divider`, `ActionBar.Group`,
 *   `ActionBar.Menu`. Rendered via the `buildChild` helper — the container-slot convention Stack
 *   established.
 * - `size`/`gap` are curated enums; `flush` is fixed-configuration -> plain boolean. Their
 *   defaults (`medium`/`condensed`/`false`) surface only in `catalog.json`, never as a zod
 *   `.default()`.
 * - `accessibility` is REQUIRED — Primer's `A11yProps` requires one of `aria-label` /
 *   `aria-labelledby`; an icon-only toolbar with no visible text must be labeled.
 *
 * `.strict()` forbids any prop outside this surface (`className` is a styling passthrough with no
 * A2UI representation — dropped).
 */
export const ActionBarApi = {
  name: 'ActionBar',
  schema: z
    .object({
      children: CommonSchemas.ChildList,
      size: z.enum(['small', 'medium', 'large']).optional(),
      flush: z.boolean().optional(),
      gap: z.enum(['none', 'condensed']).optional(),
      accessibility: CommonSchemas.AccessibilityAttributes,
    })
    .strict(),
} as const;

export type ActionBarProps = z.infer<typeof ActionBarApi.schema>;
