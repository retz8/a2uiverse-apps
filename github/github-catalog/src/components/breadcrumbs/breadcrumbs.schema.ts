import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Breadcrumbs, props-only. A navigation trail; the crumb
 * leaf (`BreadcrumbsItem`) is its only valid child. Shipped as a compound family, mirroring
 * Primer (`Breadcrumbs.Item`).
 *
 * - `children` is the synthetic `ChildList` content channel — optional, faithful to Primer's
 *   `PropsWithChildren` (an empty trail is legal in the type). The only valid children are
 *   `BreadcrumbsItem` leaves.
 * - `overflow` is the full three-value enum lifted verbatim; the `menu`/`menu-with-root` modes
 *   render via Primer's own internal `ActionList`/`Details` overlay (no catalog overlay infra).
 *   Its default (`wrap`) lives in `catalog.json`, never as a zod `.default()`.
 * - `variant` is the visual-density enum; its default (`normal`) lives in `catalog.json`.
 *
 * No `accessibility` prop: the parent `<nav>`'s `aria-label` is hardcoded (not author-facing) and
 * the prop type exposes no `aria-*` surface. The accessible surface lives on the item leaves.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const BreadcrumbsApi = {
  name: 'Breadcrumbs',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      overflow: z.enum(['wrap', 'menu', 'menu-with-root']).optional(),
      variant: z.enum(['normal', 'spacious']).optional(),
    })
    .strict(),
} as const;

export type BreadcrumbsProps = z.infer<typeof BreadcrumbsApi.schema>;
