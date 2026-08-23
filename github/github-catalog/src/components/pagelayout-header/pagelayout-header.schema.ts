import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {responsive} from '../../shared/responsive';
import {spacing, dividerResponsive} from '../../shared/page-layout';

/**
 * Runtime (zod) representation of Primer PageLayout.Header, props-only. A region leaf of the
 * `PageLayout` compound family (see `pagelayout.schema.ts`); renders only inside a `PageLayout`,
 * which references it through its `header` `ComponentId` slot and bridges it onto Primer's slot
 * scanner with `asSlot`. Shared local types (`spacing`, `dividerResponsive`) live in
 * `../../shared/page-layout`.
 *
 * - `children` is the synthetic content channel -> `ChildList` (optional).
 * - `padding` is the fixed inner padding -> `spacing` enum.
 * - `divider` is the responsive divider between the header and adjacent regions -> the shared
 *   `dividerResponsive` union (with the narrow-only `filled` arm).
 * - `hidden` supports a per-viewport value -> `responsive(z.boolean())`.
 * - `accessibility` labels the banner landmark -> `AccessibilityAttributes` (only the `label` maps,
 *   as Primer's landmark regions forward `aria-label`/`aria-labelledby` but not `aria-description`).
 * - Defaults (padding `none`, divider `none`, hidden `false`) live in `catalog.json`.
 * - `.strict()` forbids any prop outside this surface.
 */
export const PageLayoutHeaderApi = {
  name: 'PageLayout.Header',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      padding: spacing().optional(),
      divider: dividerResponsive().optional(),
      hidden: responsive(z.boolean()).optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type PageLayoutHeaderProps = z.infer<typeof PageLayoutHeaderApi.schema>;
