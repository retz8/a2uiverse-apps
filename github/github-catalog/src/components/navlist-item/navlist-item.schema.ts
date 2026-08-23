import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer NavList.Item, props-only. A single navigation link in the
 * list; it holds the label and any leading/trailing visual, description, sub-navigation, or
 * trailing action.
 *
 * - `children` is the synthetic content channel — the item's label plus any slots — typed
 *   `CommonSchemas.ChildList` (optional).
 * - `href` carries the item's link destination (`DynamicString`); `Item` is a link, so it carries
 *   no `Action` (navigation is the `href`).
 * - `aria-current` marks the user's current page/location (the string tokens; `boolean`
 *   `true`/`false` collapse to `'true'`/`'false'`).
 * - `defaultOpen` starts the item's sub-navigation expanded; `inactiveText` disables activation
 *   and explains why.
 * - `.strict()` forbids any prop outside this surface (`as`, `className`, `style`, and the rest of
 *   the host-element spread are dropped).
 */
export const NavListItemApi = {
  name: 'NavList.Item',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      href: CommonSchemas.DynamicString.optional(),
      'aria-current': z
        .enum(['page', 'step', 'location', 'date', 'time', 'true', 'false'])
        .optional(),
      defaultOpen: z.boolean().optional(),
      inactiveText: CommonSchemas.DynamicString.optional(),
    })
    .strict(),
} as const;

export type NavListItemProps = z.infer<typeof NavListItemApi.schema>;
