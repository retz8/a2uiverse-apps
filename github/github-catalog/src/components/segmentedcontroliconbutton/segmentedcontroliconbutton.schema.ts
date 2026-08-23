import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer SegmentedControl.IconButton, props-only (component name
 * `SegmentedControlIconButton`). The icon-only segment leaf for `SegmentedControl`; it renders
 * only inside a `SegmentedControl`.
 *
 * - `icon` is an element-typed required slot carried as a `ComponentId` child (the `Icon` leaf).
 * - `accessibility` is carried required: Primer's required `aria-label` maps to `accessibility`,
 *   and requiring the object is the strongest signal the shared `AccessibilityAttributes` common
 *   allows (its `label` field is itself optional, so a label must be provided since the segment
 *   renders no visible text).
 * - `description` is the tooltip copy, carried `DynamicString` for parity with the other content
 *   props (shown in place of a label).
 * - `tooltipDirection` is a curated `z.enum` over its full documented value set.
 * - `disabled` is bound runtime state -> `DynamicBoolean`.
 *
 * `selected`/`defaultSelected` are dropped — selection is centralized on the parent's
 * `selectedIndex`, derived and pushed down through context.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const SegmentedControlIconButtonApi = {
  name: 'SegmentedControlIconButton',
  schema: z
    .object({
      icon: CommonSchemas.ComponentId,
      accessibility: CommonSchemas.AccessibilityAttributes,
      description: CommonSchemas.DynamicString.optional(),
      tooltipDirection: z.enum(['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']).optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
    })
    .strict(),
} as const;

export type SegmentedControlIconButtonProps = z.infer<typeof SegmentedControlIconButtonApi.schema>;
