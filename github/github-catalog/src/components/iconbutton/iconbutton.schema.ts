import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer IconButton, props-only.
 *
 * Faithful 1:1 translation of Primer IconButton's real prop surface
 * (`ButtonA11yProps & { icon, description, tooltipDirection, keybindingHint } &
 * Omit<ButtonBaseProps, 'aria-label' | 'aria-labelledby'>`):
 * - `icon` is the required content channel — the icon-only analog of Button's `child`. It is an
 *   element-typed Primer slot; the faithful A2UI translation is a ComponentId child (references an
 *   Icon today). Unlike Button's `child`, it is REQUIRED.
 * - `action` is Primer's onClick expressed as the A2UI Action (the synthetic interaction prop);
 *   the binder resolves it to a ready-to-call () => void.
 * - `accessibility` is REQUIRED — an icon-only button must be labeled (ButtonA11yProps requires
 *   one of aria-label / aria-labelledby). Render maps `label` -> aria-label; the label is the
 *   primary tooltip line when no `description` is set.
 * - `description` is the visible tooltip content channel -> DynamicString; when set the tooltip
 *   describes the button and the accessibility label names it.
 * - `variant`/`size`/`tooltipDirection` are Primer enums lifted verbatim; defaults surface only in
 *   catalog.json, never as zod `.default(...)`.
 * - `disabled`/`loading`/`inactive` are bound runtime state -> DynamicBoolean; `block`/
 *   `loadingAnnouncement` are fixed configuration -> plain.
 * - `keybindingHint` is authoring-time config -> the installed `string | string[]` union carried
 *   verbatim (both halves shipped since the array form is documented).
 *
 * `.strict()` forbids any prop outside this surface (`labelWrap`, `keyshortcuts`,
 * `unsafeDisableTooltip`, `as`, and the raw HTML attributes are dropped).
 */
export const IconButtonApi = {
  name: 'IconButton',
  schema: z
    .object({
      icon: CommonSchemas.ComponentId,
      action: CommonSchemas.Action,
      accessibility: CommonSchemas.AccessibilityAttributes,
      description: CommonSchemas.DynamicString.optional(),
      variant: z.enum(['default', 'primary', 'invisible', 'danger', 'link']).optional(),
      size: z.enum(['small', 'medium', 'large']).optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
      loading: CommonSchemas.DynamicBoolean.optional(),
      inactive: CommonSchemas.DynamicBoolean.optional(),
      loadingAnnouncement: z.string().optional(),
      block: z.boolean().optional(),
      keybindingHint: z.union([z.string(), z.array(z.string())]).optional(),
      tooltipDirection: z.enum(['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']).optional(),
    })
    .strict(),
} as const;

export type IconButtonProps = z.infer<typeof IconButtonApi.schema>;
