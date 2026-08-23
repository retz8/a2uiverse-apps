import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer ActionList.Item, props-only (component name
 * `ActionList.Item`). A single selectable/actionable row in an ActionList. See
 * `_dev/docs/new-components/action-list-item.md`.
 *
 * Per-item, consumer-controlled selection mirroring `Checkbox` (state) + `SegmentedControl`
 * (side-effect):
 * - `children` is the synthetic `ChildList` — the item's label (a `Text` leaf) plus its
 *   leading/trailing visuals, description, and trailing action leaves, placed by Primer's own
 *   type-based slotting.
 * - `selected` is the two-way-bound selection state -> `DynamicBoolean`; the binder auto-generates
 *   `setSelected`, and a click optimistically writes the new value back before firing `action`.
 * - `action` (<- `onSelect`, optional) is the select side-effect -> `Action` (a local function or
 *   a server event); because it accepts the `event` shape, `Item` has an agent section.
 * - `active`/`disabled`/`loading` are bound runtime state -> `DynamicBoolean`; `inactiveText` is a
 *   bound display value -> `DynamicString` (its presence marks the item inactive).
 * - `variant`/`size` are Primer enums lifted verbatim; `role` is ARIA wiring -> plain string.
 *   Defaults live in `catalog.json`, never as zod `.default()`.
 * - Primer's HTML `id` prop is NOT carried: it collides with the A2UI component-envelope `id`
 *   (every component instance already has one, which the renderer stamps and other elements can
 *   reference for ARIA); a second schema prop named `id` is rejected by the envelope convention.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const ActionListItemApi = {
  name: 'ActionList.Item',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      selected: CommonSchemas.DynamicBoolean.optional(),
      action: CommonSchemas.Action.optional(),
      active: CommonSchemas.DynamicBoolean.optional(),
      variant: z.enum(['default', 'danger']).optional(),
      size: z.enum(['medium', 'large']).optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
      loading: CommonSchemas.DynamicBoolean.optional(),
      inactiveText: CommonSchemas.DynamicString.optional(),
      role: z.string().optional(),
    })
    .strict(),
} as const;

export type ActionListItemProps = z.infer<typeof ActionListItemApi.schema>;
