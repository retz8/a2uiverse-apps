import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {ICON_NAMES} from '../icon/icon.schema';

/**
 * The nested `trailingAction` on a GroupExpand item. Unlike the composable
 * `NavList.TrailingAction` leaf (which uses the `AccessibilityAttributes` common), this is a
 * data field inside the serialized `items` array, so it uses the literal `label: DynamicString`
 * field (the actual `GroupItem.trailingAction.label`) — a deliberate divergence. Its `icon` is
 * carried as the `Icon` leaf's `name` enum (an array-local value cannot hold a `ComponentId`).
 */
const groupItemTrailingActionSchema = z
  .object({
    icon: z.enum(ICON_NAMES),
    label: CommonSchemas.DynamicString,
    action: CommonSchemas.Action,
    loading: CommonSchemas.DynamicBoolean.optional(),
  })
  .strict();

/**
 * One element of the serialized `items` array — a GroupExpand navigation item expressed as data
 * (Primer's `GroupExpand` API takes items as data, not JSX children). Visual/action fields live
 * inside the element; an array-local value cannot hold a `ComponentId`, so icons are carried as
 * the `Icon` leaf's `name` enum.
 */
const groupItemSchema = z
  .object({
    text: CommonSchemas.DynamicString,
    href: CommonSchemas.DynamicString.optional(),
    ariaCurrent: z.enum(['page', 'step', 'location', 'date', 'time', 'true', 'false']).optional(),
    defaultOpen: z.boolean().optional(),
    inactiveText: CommonSchemas.DynamicString.optional(),
    leadingVisual: z.enum(ICON_NAMES).optional(),
    trailingVisual: z.string().optional(),
    trailingAction: groupItemTrailingActionSchema.optional(),
  })
  .strict();

/**
 * Runtime (zod) representation of Primer NavList.GroupExpand, props-only. An expandable group that
 * reveals its navigation items progressively behind a "show more" control.
 *
 * - `items` is the required serialized data array (not a `ChildList` — Primer takes items as data);
 *   each element is a `GroupItem` data object.
 * - `label` is the required accessible name for the expand control.
 * - `pages` is how many pages the items are revealed across (default `0`, surfaced only in
 *   `catalog.json`).
 * - `.strict()` forbids any prop outside this surface (`renderItem`, `items[].as`,
 *   `items[].data-expand-focus-target` are dropped).
 */
export const NavListGroupExpandApi = {
  name: 'NavList.GroupExpand',
  schema: z
    .object({
      items: z.array(groupItemSchema),
      label: CommonSchemas.DynamicString,
      pages: z.number().optional(),
    })
    .strict(),
} as const;

export type NavListGroupExpandProps = z.infer<typeof NavListGroupExpandApi.schema>;
