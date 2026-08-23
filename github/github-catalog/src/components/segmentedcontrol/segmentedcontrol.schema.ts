import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {responsive} from '../../shared/responsive';

/**
 * The per-viewport `variant` enum: hide the segment labels, or collapse the whole control into a
 * dropdown, per viewport. Reused by the responsive object arm of `variant`.
 */
const variantEnum = () => z.enum(['default', 'hideLabels', 'dropdown']);

/**
 * Runtime (zod) representation of Primer SegmentedControl, props-only. A set of buttons where
 * exactly one is selected at a time; the two segment leaves (`SegmentedControlButton`,
 * `SegmentedControlIconButton`) are its only valid children.
 *
 * - `children` is the synthetic `ChildList` content channel — optional, faithful to Primer's
 *   `PropsWithChildren` (an empty control is legal in the type).
 * - `selectedIndex` is synthetic: it promotes Primer's own `onChange(selectedIndex)` payload to a
 *   single two-way-bound container prop (the single source of truth), replacing the per-child
 *   `selected` authoring surface. The binder auto-generates `setSelectedIndex` from the
 *   `DynamicNumber`; a segment click writes the clicked index back through it (as Checkbox writes
 *   `checked`).
 * - `action` is the optional change side-effect (a local function or a server event); it composes
 *   with the intrinsic `selectedIndex` write.
 * - `fullWidth` carries its full `ResponsiveValue` union via `responsive()` with a plain boolean
 *   scalar arm. Its default (`false`) lives in `catalog.json`, never as a zod `.default()`.
 * - `variant` is a bespoke union, NOT the standard `responsive()` helper: its scalar arm is only
 *   the literal `'default'` — `hideLabels`/`dropdown` are reachable only through the per-viewport
 *   object, faithful to Primer's type.
 * - `size` is a curated enum lifted verbatim.
 * - `accessibility` is the accessible label for the group of segments.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const SegmentedControlApi = {
  name: 'SegmentedControl',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      selectedIndex: CommonSchemas.DynamicNumber.optional(),
      action: CommonSchemas.Action.optional(),
      fullWidth: responsive(z.boolean()).optional(),
      size: z.enum(['small', 'medium']).optional(),
      variant: z
        .union([
          z.literal('default'),
          z.object({
            narrow: variantEnum().optional(),
            regular: variantEnum().optional(),
            wide: variantEnum().optional(),
          }),
        ])
        .optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type SegmentedControlProps = z.infer<typeof SegmentedControlApi.schema>;
