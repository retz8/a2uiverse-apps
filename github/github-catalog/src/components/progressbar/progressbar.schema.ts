import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * The 12 semantic color roles a filled segment can take. The adapter maps a role to
 * Primer's `<role>.emphasis` bg color token at render time (see progressbar.tsx).
 */
const BG_ROLES = [
  'success',
  'attention',
  'severe',
  'danger',
  'accent',
  'done',
  'open',
  'closed',
  'draft',
  'neutral',
  'sponsors',
  'upsell',
] as const;

/**
 * One element of the synthetic `segments` array — the multi-segment form's data shape.
 * Primer takes segments as `ProgressBar.Item` children, but A2UI children are component
 * IDs, so the authored segments arrive as data (the synthetic-content-prop rule).
 */
const segmentSchema = z
  .object({
    progress: CommonSchemas.DynamicNumber,
    bg: z.enum(BG_ROLES).optional(),
    label: CommonSchemas.DynamicString.optional(),
  })
  .strict();

/**
 * Runtime (zod) representation of Primer ProgressBar, props-only.
 *
 * - `progress` (single-bar form) and `segments` (multi-segment form) are mutually exclusive
 *   and both optional; omitting both renders an empty track. The exclusivity is NOT encoded
 *   as a top-level zod `.refine()`: that produces a `ZodEffects`, which both the GenericBinder
 *   (`scrapeSchemaBehavior` requires a `ZodObject`) and the parity test (`api.schema.shape`)
 *   depend on being a plain object. It is enforced downstream instead — Primer's own
 *   implementation throws if both a progress value and children reach it, and the render View
 *   branches so only one form is ever passed.
 * - `bg` / `barSize` are Primer's real enums; `inline` / `animated` are fixed-config booleans.
 * - `accessibility` names what is progressing for assistive technologies.
 * - `.strict()` forbids any prop outside this surface.
 */
export const ProgressBarApi = {
  name: 'ProgressBar',
  schema: z
    .object({
      progress: CommonSchemas.DynamicNumber.optional(),
      segments: z.array(segmentSchema).optional(),
      bg: z.enum(BG_ROLES).optional(),
      barSize: z.enum(['small', 'default', 'large']).optional(),
      inline: z.boolean().optional(),
      animated: z.boolean().optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type ProgressBarProps = z.infer<typeof ProgressBarApi.schema>;
export type ProgressBarBgRole = (typeof BG_ROLES)[number];
