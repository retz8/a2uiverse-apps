import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer SegmentedControl.Button, props-only (component name
 * `SegmentedControlButton`). The text segment leaf for `SegmentedControl`; it renders only inside
 * a `SegmentedControl`.
 *
 * - `label` is the synthetic content channel for Primer's raw-text `children` (the Text
 *   precedent — literal or path-bound `DynamicString`), required as the segment's primary content.
 * - `leadingVisual` is an element-typed slot carried as a `ComponentId` child (the `Icon` leaf).
 * - `count` carries its `number | string` union as a display `DynamicString` (the Button `count`
 *   precedent).
 * - `disabled` is bound runtime state -> `DynamicBoolean`.
 * - `accessibility` is carried optional (the visible `label` already supplies the accessible
 *   name); Primer's segment spreads `ButtonHTMLAttributes` (the aria-* slice).
 *
 * `selected`/`defaultSelected` are dropped — selection is centralized on the parent's
 * `selectedIndex`, and a segment's selected-ness is derived and pushed down through context.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const SegmentedControlButtonApi = {
  name: 'SegmentedControlButton',
  schema: z
    .object({
      label: CommonSchemas.DynamicString,
      leadingVisual: CommonSchemas.ComponentId.optional(),
      count: CommonSchemas.DynamicString.optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type SegmentedControlButtonProps = z.infer<typeof SegmentedControlButtonApi.schema>;
