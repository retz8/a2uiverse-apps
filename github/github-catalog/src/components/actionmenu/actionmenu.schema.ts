import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `ActionMenu` (the root), props-only. A trigger element
 * that opens a floating menu of actions or options positioned relative to itself; the menu opens
 * and dismisses by mouse or keyboard, and choosing an item closes it. The container leaf of the
 * `ActionMenu` compound family. See `_dev/docs/new-components/actionmenu.md` for the family note.
 *
 * Self-contained overlay — no new infra: Primer's `ActionMenu` portals the menu to the document
 * body and manages its own focus trap, Escape handling, outside-click dismissal, and roving item
 * focus, rendering through the normal adapter→renderer path (the `Dialog` 6.52 / `AnchoredOverlay`
 * 6.55 precedent).
 *
 * - `children` is the synthetic primary slot (required) -> ChildList: a trigger
 *   (`ActionMenu.Button` or `ActionMenu.Anchor`) plus an `ActionMenu.Overlay`. Primer's own
 *   type-based slotting places the trigger and the overlay; the family stays permissive on which
 *   child fills which slot.
 * - `open` is the controlled visibility state -> DynamicBoolean (optional). Two-way bound like
 *   Checkbox's `checked`: the binder auto-generates `setOpen`, wired as Primer's `onOpenChange`, so
 *   an open gesture writes `true` back and a close gesture (Escape / outside-click / item-select)
 *   writes `false`. Unlike `AnchoredOverlay` (whose `open` is required), `ActionMenu` supports the
 *   uncontrolled mode: when `open` is omitted Primer runs the menu with its own internal open state.
 *
 * `.strict()` forbids any prop outside this surface. Dropped/deferred: `onOpenChange` (folded into
 * the `open` two-way write-back), `anchorRef` (ref-typed anchor wiring — the trigger is carried as
 * a child in `children`).
 */
export const ActionMenuApi = {
  name: 'ActionMenu',
  schema: z
    .object({
      children: CommonSchemas.ChildList,
      open: CommonSchemas.DynamicBoolean.optional(),
    })
    .strict(),
} as const;

export type ActionMenuProps = z.infer<typeof ActionMenuApi.schema>;
