import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {responsive} from '../../shared/responsive';
import {spacing, paneWidth} from '../../shared/page-layout';

/**
 * Runtime (zod) representation of Primer PageLayout.Sidebar, props-only. A region leaf of the
 * `PageLayout` compound family (see `pagelayout.schema.ts`); renders only inside a `PageLayout`,
 * which references it through its `sidebar` `ComponentId` slot and bridges it onto Primer's slot
 * scanner with `asSlot`. A full-height region alongside the header, content, and footer. Distinct
 * from Pane: its `position` and `divider` are non-responsive, and it adds a `responsiveVariant`.
 * Shared local types (`spacing`, `paneWidth`) and the controlled-resize two-way-binding convention
 * live in `../../shared/page-layout`.
 *
 * - `children` -> `ChildList` (optional).
 * - `position` -> plain `z.enum(['start','end'])` (non-responsive); `divider` -> plain
 *   `z.enum(['none','line'])`.
 * - `width` -> the shared `paneWidth` union (named size or custom min/default/max).
 * - `minWidth` / `sticky` / `resizable` / `widthStorageKey` are fixed configuration ->
 *   number/boolean/boolean/string. `widthStorageKey` has no default: omitting it disables
 *   persistence (Primer's behavior).
 * - `padding` -> `spacing` enum; `responsiveVariant` -> `z.enum(['default','fullscreen'])`.
 * - `hidden` supports a per-viewport value -> `responsive(z.boolean())`.
 * - `currentWidth` is the controlled width -> `DynamicNumber` (optional), same controlled/
 *   uncontrolled rule as Pane. `onResizeEnd` is folded into this binding.
 * - `accessibility` labels the sidebar region -> `AccessibilityAttributes` (only `label` maps).
 * - Defaults live in `catalog.json`, never as a zod `.default()`.
 * - `.strict()` forbids any prop outside this surface.
 */
export const PageLayoutSidebarApi = {
  name: 'PageLayout.Sidebar',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      position: z.enum(['start', 'end']).optional(),
      width: paneWidth().optional(),
      minWidth: z.number().optional(),
      padding: spacing().optional(),
      divider: z.enum(['none', 'line']).optional(),
      sticky: z.boolean().optional(),
      responsiveVariant: z.enum(['default', 'fullscreen']).optional(),
      hidden: responsive(z.boolean()).optional(),
      resizable: z.boolean().optional(),
      currentWidth: CommonSchemas.DynamicNumber.optional(),
      widthStorageKey: z.string().optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type PageLayoutSidebarProps = z.infer<typeof PageLayoutSidebarApi.schema>;
