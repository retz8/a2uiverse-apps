import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer ActionList (the root), props-only. The vertically
 * stacked list of actions/options; the ActionList compound family's container leaf. See
 * `_dev/docs/new-components/action-list.md` for the family note and shared conventions.
 *
 * - `children` is the synthetic `ChildList` content channel — the items, groups, dividers, and
 *   heading contained in the list (optional, faithful to Primer's optional `children`). The
 *   family stays permissive on which child fills which slot; Primer's own type-based slotting
 *   places the item/visual/description leaves.
 * - `variant`/`selectionVariant`/`role` are Primer enums/strings lifted verbatim; `selectionVariant`
 *   carries the `radio` value that the doc's props table omits (code is authority).
 * - `showDividers`/`disableFocusZone` are fixed configuration -> plain booleans; `as` narrows the
 *   list container to the display-equivalent `ul`/`ol`/`div`. Defaults live in `catalog.json`,
 *   never as zod `.default()`.
 * - `accessibility` maps `label`/`description` onto `aria-label`/`aria-description` for the
 *   listbox/menu container.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const ActionListApi = {
  name: 'ActionList',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      variant: z.enum(['inset', 'horizontal-inset', 'full']).optional(),
      selectionVariant: z.enum(['single', 'radio', 'multiple']).optional(),
      showDividers: z.boolean().optional(),
      role: z.string().optional(),
      disableFocusZone: z.boolean().optional(),
      as: z.enum(['ul', 'ol', 'div']).optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type ActionListProps = z.infer<typeof ActionListApi.schema>;
