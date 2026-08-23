import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer ToggleSwitch, props-only.
 *
 * Faithful 1:1 translation of Primer ToggleSwitch's real prop surface (see the decision doc
 * `_dev/docs/new-components/toggleswitch.md`):
 * - `checked` is REQUIRED and two-way bound (DynamicBoolean): the user's flip writes the new
 *   value back to the bound data-model path locally via the binder's auto-generated setter.
 *   There is no uncontrolled mode — `defaultChecked` is dropped (findings §6).
 * - `action` is Primer's `onChange` (with `onClick` collapsed in) expressed as the A2UI Action;
 *   the flip-time channel for settings that must reach the agent or run a local function. The
 *   binder resolves it to a ready-to-call () => void.
 * - `disabled`/`loading` are bound runtime state -> DynamicBoolean.
 * - `size`/`statusLabelPosition` are Primer enums lifted verbatim.
 * - `buttonLabelOn`/`buttonLabelOff`/`loadingLabel`/`loadingLabelDelay` are fixed configuration
 *   -> plain string/number (their `(default: X)` surfaces only in catalog.json, not as `.default`).
 * - `accessibility` is REQUIRED: the switch renders no visible label of its own, so an accessible
 *   name is mandatory. It maps to CommonSchemas.AccessibilityAttributes (the aria-labelledby /
 *   aria-describedby channel, which A2UI has no cross-DOM-id form of).
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const ToggleSwitchApi = {
  name: 'ToggleSwitch',
  schema: z
    .object({
      checked: CommonSchemas.DynamicBoolean,
      action: CommonSchemas.Action.optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
      loading: CommonSchemas.DynamicBoolean.optional(),
      size: z.enum(['small', 'medium']).optional(),
      statusLabelPosition: z.enum(['start', 'end']).optional(),
      buttonLabelOn: z.string().optional(),
      buttonLabelOff: z.string().optional(),
      loadingLabel: z.string().optional(),
      loadingLabelDelay: z.number().optional(),
      accessibility: CommonSchemas.AccessibilityAttributes,
    })
    .strict(),
} as const;

export type ToggleSwitchProps = z.infer<typeof ToggleSwitchApi.schema>;
