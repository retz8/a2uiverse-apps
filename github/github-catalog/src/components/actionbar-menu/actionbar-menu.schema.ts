import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * The shared fields of an `ActionBar.Menu` entry. `items` is an authoring-time DATA array
 * (faithful to Primer's data-driven `items` API), so its scalar fields are plain
 * (`z.string()`/`z.boolean()`/`z.enum`); its reference fields are the A2UI primitives the generic
 * binder resolves in place — `action` (`Action` -> a ready-to-call closure, dispatched on select)
 * and `leadingVisual`/`trailingVisual` (`ComponentId` icons, resolved via `buildChild`).
 *
 * A `trailingVisual` may instead be a short text string (`z.union([ComponentId, z.string()])`);
 * both collapse to a JSON string, so the render disambiguates by looking the id up in the surface.
 *
 * NOTE (build-time judgment): the decision doc specifies the item as a `z.discriminatedUnion` with
 * a `z.lazy` self-reference for arbitrarily-deep submenus. The generic binder's schema scraper only
 * recurses through plain `ZodObject`/`ZodArray` nodes — a `ZodDiscriminatedUnion`/`ZodLazy` node is
 * treated as opaque STATIC, so nested `action`s would never be resolved to callables. To keep the
 * per-item interactions functional (the whole point of the agent surface), the item is modeled as a
 * plain object with an optional `type` discriminator and one explicit level of nesting (`items`),
 * which covers the shipped `action-bar-menu` fixture's `More -> [Sub A, Sub B]` submenu.
 */
const menuItemBase = {
  type: z.enum(['action', 'divider']).optional(),
  label: z.string().optional(),
  action: CommonSchemas.Action.optional(),
  disabled: z.boolean().optional(),
  leadingVisual: CommonSchemas.ComponentId.optional(),
  trailingVisual: z.union([CommonSchemas.ComponentId, z.string()]).optional(),
  variant: z.enum(['default', 'danger']).optional(),
};

/** A submenu (leaf) entry — the same shape, without further nesting. */
export const actionBarMenuLeafItemSchema = z.object(menuItemBase).strict();

/** A top-level menu entry — may carry a one-level submenu of leaf entries. */
export const actionBarMenuItemSchema = z
  .object({
    ...menuItemBase,
    items: z.array(actionBarMenuLeafItemSchema).optional(),
  })
  .strict();

/**
 * Runtime (zod) representation of Primer `ActionBar.Menu` (exported as `ActionBarMenu`), props-only
 * (component name `ActionBar.Menu`). A toolbar button that opens a dropdown menu of actions; menu
 * entries may carry icons, trailing text, and nested submenus, and may be separated by dividers.
 *
 * - `icon` is the required `ComponentId` shown on the menu button (references an `Icon`).
 * - `accessibility` is REQUIRED — the menu button is icon-only and must be labeled; maps to
 *   `aria-label` (or `aria-labelledby`).
 * - `items` is the required authored menu structure (see the item schema above).
 * - `overflowIcon` is the icon shown when the toolbar collapses this menu into its overflow menu;
 *   defaults to the menu button's own `icon`, or `'none'` to show no icon.
 *
 * The menu button emits no author action of its own (clicking it opens the overlay — internal
 * state); interactions live on the per-item `action` fields. `variant` (hardcoded `invisible`) and
 * the intersection-inherited `IconButtonProps` are dropped. `.strict()` forbids any prop outside
 * this surface.
 */
export const ActionBarMenuApi = {
  name: 'ActionBar.Menu',
  schema: z
    .object({
      icon: CommonSchemas.ComponentId,
      accessibility: CommonSchemas.AccessibilityAttributes,
      items: z.array(actionBarMenuItemSchema),
      overflowIcon: z.union([CommonSchemas.ComponentId, z.literal('none')]).optional(),
    })
    .strict(),
} as const;

export type ActionBarMenuProps = z.infer<typeof ActionBarMenuApi.schema>;
