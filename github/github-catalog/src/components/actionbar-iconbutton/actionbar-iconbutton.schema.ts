import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `ActionBar.IconButton` (exported as `ActionBarIconButton`),
 * props-only (component name `ActionBar.IconButton`). An icon-only button inside an `ActionBar`
 * toolbar; it triggers an action when activated and carries a required label for assistive
 * technologies.
 *
 * Scope: the component's DOCUMENTED toolbar-button surface (`icon`, `aria-label`, `disabled`) plus
 * the mandatory interaction. `variant` is hardcoded to `invisible` by ActionBar (inert), `size` is
 * controlled by the parent `ActionBar` via context, and the rest of the intersected
 * `IconButtonProps` is undocumented here — all dropped (that surface is `IconButton`'s (6.29)).
 *
 * - `icon` is the required `ComponentId` content channel (references an `Icon`, per 6.2) — the
 *   icon-only analog of Button's `child`, required as on `IconButton`.
 * - `action` is Primer's `onClick` expressed as the A2UI `Action` (the synthetic interaction prop);
 *   the binder resolves it to a ready-to-call `() => void`.
 * - `accessibility` is REQUIRED — an icon-only button must be labeled; maps to `aria-label`
 *   (or `aria-labelledby`), which doubles as the tooltip text.
 * - `disabled` is bound runtime state -> `DynamicBoolean`; applied as `aria-disabled` (the button
 *   stays focusable, with a click guard).
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const ActionBarIconButtonApi = {
  name: 'ActionBar.IconButton',
  schema: z
    .object({
      icon: CommonSchemas.ComponentId,
      action: CommonSchemas.Action,
      accessibility: CommonSchemas.AccessibilityAttributes,
      disabled: CommonSchemas.DynamicBoolean.optional(),
    })
    .strict(),
} as const;

export type ActionBarIconButtonProps = z.infer<typeof ActionBarIconButtonApi.schema>;
