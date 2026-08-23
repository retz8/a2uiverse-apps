import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer TextInput.Action, props-only.
 *
 * The trailing-action affordance for TextInput: an icon action button rendered inside a text
 * input at its trailing edge (TextInput's `trailingAction` references one by ComponentId).
 *
 * Faithful translation of Primer TextInput.Action's real prop surface (resolved from the
 * installed `@primer/react` type declarations):
 * - `action` is Primer's onClick expressed as the A2UI Action; the binder resolves it to a
 *   ready-to-call () => void. It is REQUIRED — the button exists to trigger an action.
 * - `icon` is the element-typed icon slot; the faithful A2UI translation is a ComponentId child
 *   (references an Icon).
 * - `disabled` is bound runtime state -> DynamicBoolean.
 * - `tooltipDirection` is a Primer enum lifted verbatim -> local z.enum (there is no
 *   DynamicEnum). The default (`'s'`) surfaces only in catalog.json, not as .default().
 * - `accessibility` supplies the accessible label, which Primer also shows as the button's
 *   tooltip text -> CommonSchemas.AccessibilityAttributes.
 *
 * Dropped (no A2UI representation): `children`/`variant` (@deprecated), `type` (hardcoded
 * 'button'), `aria-labelledby` and the rest of the non-`aria-*` ButtonHTMLAttributes spread.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const TextInputActionApi = {
  name: 'TextInput.Action',
  schema: z
    .object({
      action: CommonSchemas.Action,
      icon: CommonSchemas.ComponentId.optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
      tooltipDirection: z.enum(['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']).optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type TextInputActionProps = z.infer<typeof TextInputActionApi.schema>;
