import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer ActionList.LinkItem, props-only (component name
 * `ActionList.LinkItem`). An action-list row that navigates to a URL when clicked, rendered as a
 * link. See `_dev/docs/new-components/action-list-linkitem.md`.
 *
 * - `children` is the synthetic `ChildList` — the link item's label plus its leading/trailing
 *   visuals and description leaves, placed by Primer's own type-based slotting.
 * - `href` is the required navigation target -> `DynamicString`.
 * - `active`/`inactiveText` are bound runtime state/display -> `DynamicBoolean`/`DynamicString`.
 * - `variant`/`size` are picked from `Item` and carried faithfully (code is authority); `target`
 *   is the one meaningful anchor attribute (the `Link` precedent). Defaults live in `catalog.json`.
 *
 * `LinkItem`'s designed interaction is navigation via `href`; it carries no `Action` and needs no
 * local function. `.strict()` forbids any prop outside this surface.
 */
export const ActionListLinkItemApi = {
  name: 'ActionList.LinkItem',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      href: CommonSchemas.DynamicString,
      active: CommonSchemas.DynamicBoolean.optional(),
      inactiveText: CommonSchemas.DynamicString.optional(),
      variant: z.enum(['default', 'danger']).optional(),
      size: z.enum(['medium', 'large']).optional(),
      target: z.enum(['_self', '_blank']).optional(),
    })
    .strict(),
} as const;

export type ActionListLinkItemProps = z.infer<typeof ActionListLinkItemApi.schema>;
