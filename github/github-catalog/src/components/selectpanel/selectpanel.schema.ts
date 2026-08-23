import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `SelectPanel`, props-only. A dialog that lets a user find
 * and select one or several items from a filterable list, opened from a trigger. Shipped as a
 * compound family (`SelectPanel` + `SelectPanel.Item`, 6.50).
 *
 * SelectPanel fuses `AnchoredOverlay` (anchor + open + positioning) and a filtered `ActionList`
 * (items + per-item selection) plus panel chrome. Its render behavior is component-local logic
 * (the AnchoredOverlay precedent):
 * - `anchor` is the synthetic primary slot, tightened to REQUIRED (without a trigger the panel has
 *   nothing to open from) -> ComponentId, wrapped in a ref-bearing element handed to Primer's
 *   `renderAnchor`.
 * - `children` (<- Primer `items`) is the synthetic content channel, tightened to REQUIRED (an
 *   empty list is still valid — the `message` empty state renders instead) -> ChildList of
 *   `SelectPanel.Item`; the render fn maps each resolved item leaf to one Primer `ItemInput`.
 * - `open` is the controlled visibility state -> DynamicBoolean (required); two-way bound like
 *   AnchoredOverlay's `open` — the trigger's open/close gestures write it back automatically.
 * - `selectionVariant` sets single- vs multi-select mode -> local z.enum.
 * - `filterValue` is the filter input's text -> DynamicString, two-way bound; the list filters
 *   against it locally (no agent round-trip).
 * - `variant` anchors the panel to the trigger or opens it as a centered modal -> local z.enum.
 * - `onOpenChange`/`onCancel` are optional additional Actions layered on the automatic state flip.
 * - the remaining props are panel chrome / list configuration lifted from Primer verbatim.
 *
 * Dropped/deferred (no A2UI representation), per the decision doc: `selected`/`onSelectedChange`
 * (represented by the per-item `SelectPanel.Item.selected` bindings), `onFilterChange` (represented
 * by the two-way `filterValue` write-back), `placeholder` (superseded by the synthetic `anchor`),
 * `renderAnchor`/`anchorRef`/`anchorId` (function/ref/id anchor wiring), `footer` (deprecated),
 * `initialLoadingType`/`loadingType` (loader-style knobs), `message.icon`/`message.action` and
 * `groupMetadata`/`groupId`/`renderItem`/`renderGroup` (deferred element-typed / grouping),
 * `overlayProps`/`textInputProps`/`actionListProps` (untyped passthrough bags), refs and
 * observational callbacks, private/behavioral tuning knobs, `role`/`id`/`aria-label`,
 * `messageText`, `className`.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const SelectPanelApi = {
  name: 'SelectPanel',
  schema: z
    .object({
      anchor: CommonSchemas.ComponentId,
      children: CommonSchemas.ChildList,
      open: CommonSchemas.DynamicBoolean,
      selectionVariant: z.enum(['single', 'multiple']).optional(),
      title: CommonSchemas.DynamicString.optional(),
      subtitle: CommonSchemas.DynamicString.optional(),
      filterValue: CommonSchemas.DynamicString.optional(),
      placeholderText: CommonSchemas.DynamicString.optional(),
      inputLabel: CommonSchemas.DynamicString.optional(),
      variant: z.enum(['anchored', 'modal']).optional(),
      onOpenChange: CommonSchemas.Action.optional(),
      onCancel: CommonSchemas.Action.optional(),
      secondaryAction: CommonSchemas.ComponentId.optional(),
      notice: z
        .object({
          text: CommonSchemas.DynamicString,
          variant: z.enum(['info', 'warning', 'error']),
        })
        .optional(),
      message: z
        .object({
          title: CommonSchemas.DynamicString,
          body: CommonSchemas.DynamicString,
          variant: z.enum(['empty', 'error', 'warning']),
        })
        .optional(),
      loading: CommonSchemas.DynamicBoolean.optional(),
      showSelectedOptionsFirst: z.boolean().optional(),
      showSelectAll: z.boolean().optional(),
      align: z.enum(['start', 'center', 'end']).optional(),
      height: z
        .enum(['xsmall', 'small', 'medium', 'large', 'xlarge', 'auto', 'initial', 'fit-content'])
        .optional(),
      width: z.enum(['small', 'medium', 'large', 'xlarge', 'xxlarge', 'auto']).optional(),
      displayInViewport: z.boolean().optional(),
      showItemDividers: z.boolean().optional(),
      virtualized: z.boolean().optional(),
      focusOutBehavior: z.enum(['stop', 'wrap']).optional(),
      disableFullscreenOnNarrow: z.boolean().optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type SelectPanelProps = z.infer<typeof SelectPanelApi.schema>;
