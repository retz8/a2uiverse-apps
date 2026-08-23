import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `ActionMenu.Button` (component name `ActionMenu.Button`),
 * props-only. The button that opens the menu — a faithful twin of the `Button` leaf surface with
 * the interaction slot removed. Part of the `ActionMenu` compound family (6.39); see
 * `_dev/docs/new-components/actionmenu-button.md`.
 *
 * `ActionMenuButtonProps = ButtonProps` ("syntactical sugar"), so the surface is identical to the
 * shipped `Button` leaf **minus `action`**: Primer owns the trigger's click (it toggles the parent
 * menu), so the trigger carries no action of its own. Same A2UI types as `button.md` for every
 * carried prop.
 *
 * `.strict()` forbids any prop outside this surface. Dropped/deferred: `action`/`onClick` (owned by
 * the parent menu), `as`/`href` (behavioral polymorphism — the `button.md` precedent), and the rest
 * of the non-`aria-*` `ButtonHTMLAttributes` spread.
 */
export const ActionMenuButtonApi = {
  name: 'ActionMenu.Button',
  schema: z
    .object({
      child: CommonSchemas.ComponentId.optional(),
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

export type ActionMenuButtonProps = z.infer<typeof ActionMenuButtonApi.schema>;
