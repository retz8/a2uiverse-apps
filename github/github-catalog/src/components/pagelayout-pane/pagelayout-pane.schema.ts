import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {responsive} from '../../shared/responsive';
import {spacing, dividerResponsive, paneWidth} from '../../shared/page-layout';

/**
 * Runtime (zod) representation of Primer PageLayout.Pane, props-only. A region leaf of the
 * `PageLayout` compound family (see `pagelayout.schema.ts`); renders only inside a `PageLayout`,
 * which references it through its `pane` `ComponentId` slot. The pane falls through Primer's
 * `useSlots` to `rest` and self-positions start/end via CSS + PageLayoutContext. Shared local types
 * (`spacing`, `dividerResponsive`, `paneWidth`) and the controlled-resize two-way-binding
 * convention live in `../../shared/page-layout`.
 *
 * - `children` -> `ChildList` (optional).
 * - `position` picks the side, per-viewport -> `responsive(z.enum(['start','end']))`.
 * - `width` -> the shared `paneWidth` union (named size or custom min/default/max).
 * - `minWidth` / `sticky` / `offsetHeader` / `resizable` / `widthStorageKey` are fixed
 *   configuration -> plain number/boolean/(number|string)/boolean/string.
 * - `padding` -> `spacing` enum; `divider` -> the shared `dividerResponsive` union.
 * - `hidden` supports a per-viewport value -> `responsive(z.boolean())`.
 * - `currentWidth` is the pane's controlled width -> `DynamicNumber` (optional). Two-way bound: when
 *   supplied, the render passes it with Primer's `onResizeEnd` write-back (controlled mode); when
 *   absent, the pane is uncontrolled and `widthStorageKey` names its localStorage slot. `onResizeEnd`
 *   is folded into this binding, so it is not a separate prop (the Checkbox `checked` pattern).
 * - `accessibility` labels the pane region -> `AccessibilityAttributes` (only `label` maps; Primer's
 *   region forwards `aria-label`/`aria-labelledby`, not `aria-description`).
 * - Defaults live in `catalog.json`, never as a zod `.default()`.
 * - `.strict()` forbids any prop outside this surface.
 */
export const PageLayoutPaneApi = {
  name: 'PageLayout.Pane',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      position: responsive(z.enum(['start', 'end'])).optional(),
      width: paneWidth().optional(),
      minWidth: z.number().optional(),
      padding: spacing().optional(),
      divider: dividerResponsive().optional(),
      sticky: z.boolean().optional(),
      offsetHeader: z.union([z.number(), z.string()]).optional(),
      hidden: responsive(z.boolean()).optional(),
      resizable: z.boolean().optional(),
      currentWidth: CommonSchemas.DynamicNumber.optional(),
      widthStorageKey: z.string().optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type PageLayoutPaneProps = z.infer<typeof PageLayoutPaneApi.schema>;
