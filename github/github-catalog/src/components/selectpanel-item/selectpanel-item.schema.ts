import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of one `SelectPanel.Item` — a single selectable row in a
 * `SelectPanel` (the compound family shipped in 6.50; see the family note in `selectpanel.md`).
 * Props-only. Each `SelectPanel.Item` maps to one Primer `ItemInput` in the SelectPanel render fn
 * (the item leaf never renders standalone — its parent reads its resolved props as `items` data).
 *
 * Faithful translation of Primer's `ItemInput` / `FilteredActionListItemProps` item descriptor
 * (resolved from the installed `@primer/react` type declarations at
 * `FilteredActionList/types.d.ts`), reconciled against the official SelectPanel doc:
 * - `text` is the item's primary label -> DynamicString, tightened to REQUIRED (an item always
 *   names itself).
 * - `description` is the secondary detail line -> DynamicString.
 * - `descriptionVariant` positions the secondary text inline (beside) or block (below) -> local
 *   z.enum (there is no DynamicEnum).
 * - `leadingVisual`/`trailingVisual` are visuals shown before/after the label -> ComponentId.
 * - `variant` is the item style (`danger` marks a destructive choice) -> local z.enum.
 * - `selected` is the two-way-bound selection state -> DynamicBoolean; a click optimistically writes
 *   the new value back to its bound path (the ActionList.Item selection precedent). Meaningful only
 *   when the panel sets a `selectionVariant`.
 * - `disabled` is bound runtime state -> DynamicBoolean.
 * - `action` (<- Primer `onAction`) is the optional side-effect on select — a `functionCall` (local)
 *   or an agent `event`; because it accepts the event shape, the item has an agent section.
 *
 * Dropped/deferred (no A2UI representation): `children` (raw ReactNode content channel, superseded
 * by `text` + `leadingVisual`), `trailingIcon`/`trailingText` (deprecated), `groupId` (item
 * grouping, deferred), `onAction` (represented by `action`), `role` (fixed to listbox `option` by
 * the render fn), `item` (callback payload object), `accessibility` (name comes from `text`),
 * `className` and the non-`aria-*` div HTML spread. Primer's HTML `id` is NOT carried: it collides
 * with the A2UI component-envelope `id`, which already supplies the item's selection identity and
 * ARIA reference (the `ActionList.Item` envelope-`id` precedent); a second schema prop named `id`
 * is rejected by the envelope convention.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const SelectPanelItemApi = {
  name: 'SelectPanel.Item',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      description: CommonSchemas.DynamicString.optional(),
      descriptionVariant: z.enum(['inline', 'block']).optional(),
      leadingVisual: CommonSchemas.ComponentId.optional(),
      trailingVisual: CommonSchemas.ComponentId.optional(),
      variant: z.enum(['default', 'danger']).optional(),
      selected: CommonSchemas.DynamicBoolean.optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
      action: CommonSchemas.Action.optional(),
    })
    .strict(),
} as const;

export type SelectPanelItemProps = z.infer<typeof SelectPanelItemApi.schema>;
