import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {responsive} from '../../shared/responsive';
import {spacing, sizeWidth} from '../../shared/page-layout';

/**
 * Runtime (zod) representation of Primer PageLayout.Content, props-only. A region leaf of the
 * `PageLayout` compound family (see `pagelayout.schema.ts`); renders only inside a `PageLayout`,
 * which references it through its `content` `ComponentId` slot. Content falls through Primer's
 * `useSlots` to `rest` (needs no slot marker). Shared local types (`spacing`, `sizeWidth`) live in
 * `../../shared/page-layout`.
 *
 * - `children` is the synthetic content channel -> `ChildList` (optional).
 * - `as` picks the rendered element / landmark identity -> a narrowed enum of display-equivalent
 *   elements (default `main`).
 * - `width` is the max content width -> `sizeWidth` enum.
 * - `padding` is the fixed inner padding -> `spacing` enum.
 * - `hidden` supports a per-viewport value -> `responsive(z.boolean())`.
 * - `accessibility` labels the main landmark -> `AccessibilityAttributes` (only `label` maps;
 *   Primer's landmark forwards `aria-label`/`aria-labelledby`, not `aria-description`).
 * - Defaults (as `main`, width `full`, padding `none`, hidden `false`) live in `catalog.json`.
 * - `.strict()` forbids any prop outside this surface.
 */
export const PageLayoutContentApi = {
  name: 'PageLayout.Content',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      as: z.enum(['main', 'div', 'section', 'article']).optional(),
      width: sizeWidth().optional(),
      padding: spacing().optional(),
      hidden: responsive(z.boolean()).optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type PageLayoutContentProps = z.infer<typeof PageLayoutContentApi.schema>;
