import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer NavList.TrailingAction, props-only. An interactive icon
 * control at the end of a navigation item, separate from the navigation link, that performs an
 * action when activated. The NavList family's only interactive leaf and its sole agent site.
 *
 * Faithful translation of Primer's real prop surface (default element `'button'`, an IconButton):
 * - `icon` is the required content channel — an element-typed slot; the faithful A2UI translation
 *   is a `ComponentId` child (references an `Icon`). Required, like IconButton's `icon`.
 * - `accessibility` is REQUIRED — the control is icon-only, so it must be labeled. Primer's
 *   `label` prop maps to `aria-label` (IconButton parity).
 * - `action` is Primer's onClick expressed as the A2UI `Action` (the synthetic interaction prop);
 *   the binder resolves it to a ready-to-call `() => void`. Required — the control exists to act.
 * - `loading` is bound runtime state -> `DynamicBoolean` (only available for button elements).
 *
 * Dropped (no A2UI representation): `as` (the `as: 'a'` link mode is behavioral polymorphism),
 * `href` (only present in the dropped link mode), `className`, `style`.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const NavListTrailingActionApi = {
  name: 'NavList.TrailingAction',
  schema: z
    .object({
      icon: CommonSchemas.ComponentId,
      accessibility: CommonSchemas.AccessibilityAttributes,
      action: CommonSchemas.Action,
      loading: CommonSchemas.DynamicBoolean.optional(),
    })
    .strict(),
} as const;

export type NavListTrailingActionProps = z.infer<typeof NavListTrailingActionApi.schema>;
