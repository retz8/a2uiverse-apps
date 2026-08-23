import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer UnderlineNav.Item, props-only (component name
 * `UnderlineNav.Item`). The single navigation tab leaf for `UnderlineNav`; it renders only inside an
 * `UnderlineNav`. Navigates via its link or performs an action when selected, and can mark itself
 * the current page.
 *
 * - `text` is the synthetic content channel for Primer's raw-text `children` (the Text precedent —
 *   literal or path-bound `DynamicString`), required as the tab's label.
 * - `action` is the tab's select handler (`action <- onSelect`, click + keyboard). Unlike
 *   `NavList.Item` (href-only), the item documents `onSelect`, so it carries an optional `Action`
 *   alongside its optional `href` — the family's sole agent site.
 * - `href` is the tab's navigation target (`DynamicString`, optional).
 * - `aria-current` marks the current page/location (the string tokens; `boolean` `true`/`false`
 *   collapse to `'true'`/`'false'` — the NavList.Item precedent).
 * - `leadingVisual` is an element-typed slot carried as a `ComponentId` child (the `Icon` leaf).
 * - `counter` is a display value -> `DynamicString` even when usually numeric (the Button `count`
 *   precedent).
 * - `.strict()` forbids any prop outside this surface (`icon`, `as`, the `LinkProps` remainder, and
 *   the rest of the host-element spread are dropped).
 */
export const UnderlineNavItemApi = {
  name: 'UnderlineNav.Item',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      action: CommonSchemas.Action.optional(),
      href: CommonSchemas.DynamicString.optional(),
      'aria-current': z
        .enum(['page', 'step', 'location', 'date', 'time', 'true', 'false'])
        .optional(),
      leadingVisual: CommonSchemas.ComponentId.optional(),
      counter: CommonSchemas.DynamicString.optional(),
    })
    .strict(),
} as const;

export type UnderlineNavItemProps = z.infer<typeof UnderlineNavItemApi.schema>;
