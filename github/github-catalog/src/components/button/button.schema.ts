import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Button, props-only.
 *
 * Faithful 1:1 translation of Primer Button's real prop surface:
 * - `child` is the synthetic content reference (the label); it is OPTIONAL because Primer
 *   renders the button icon-only when `icon` is set (label + visuals discarded, `icon` wins).
 * - `icon`/`leadingVisual`/`trailingVisual`/`trailingAction` are Primer's element-typed slots;
 *   the faithful A2UI translation of an element slot is a ComponentId child (each may reference
 *   an Icon today or another leaf later — the agent chooses). `trailingAction` is a positioned
 *   visual slot (Primer renders it as the always-last element). Carried in 6.4 now that Icon
 *   (6.2) ships; see _dev/docs/spec/task-6.4-button-revisit.md.
 * - Render precedence (icon-only wins; explicit `trailingVisual` wins over `count`) mirrors
 *   Primer and is NOT enforced by the schema — no cross-field validation (decisions 3 & 4).
 * - `action` is Primer's onClick expressed as the A2UI Action; the binder resolves it to a
 *   ready-to-call () => void (event vs functionCall routing is the renderer's job, 2.3).
 * - `variant`/`size`/`alignContent` are Primer enums lifted verbatim.
 * - `disabled`/`loading`/`inactive` are bound runtime state -> DynamicBoolean; `count` is a
 *   bound display value -> DynamicString; `block`/`labelWrap`/`loadingAnnouncement` are fixed
 *   configuration -> plain. (Bound-state-vs-config rule: a2ui-sdk-design skill.)
 * - `accessibility` is carried because Button's type spreads React.ButtonHTMLAttributes (the
 *   aria-* slice); it maps to CommonSchemas.AccessibilityAttributes. See finding #3.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const ButtonApi = {
  name: 'Button',
  schema: z
    .object({
      child: CommonSchemas.ComponentId.optional(),
      action: CommonSchemas.Action,
      variant: z.enum(['default', 'primary', 'invisible', 'danger', 'link']).optional(),
      size: z.enum(['small', 'medium', 'large']).optional(),
      alignContent: z.enum(['start', 'center']).optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
      loading: CommonSchemas.DynamicBoolean.optional(),
      inactive: CommonSchemas.DynamicBoolean.optional(),
      count: CommonSchemas.DynamicString.optional(),
      block: z.boolean().optional(),
      labelWrap: z.boolean().optional(),
      loadingAnnouncement: z.string().optional(),
      icon: CommonSchemas.ComponentId.optional(),
      leadingVisual: CommonSchemas.ComponentId.optional(),
      trailingVisual: CommonSchemas.ComponentId.optional(),
      trailingAction: CommonSchemas.ComponentId.optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type ButtonProps = z.infer<typeof ButtonApi.schema>;
