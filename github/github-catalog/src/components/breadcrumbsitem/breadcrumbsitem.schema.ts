import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Breadcrumbs.Item, props-only (component name
 * `BreadcrumbsItem`). The crumb leaf for `Breadcrumbs`; it renders only inside a `Breadcrumbs`.
 *
 * - `label` is the synthetic content channel for Primer's raw-text `children` (the Text
 *   precedent — literal or path-bound `DynamicString`), required as the crumb's primary content.
 * - `href` is the per-crumb navigation target (the `Link` precedent). Carried optional: the
 *   current-page crumb (`selected`) reasonably omits a destination — a Breadcrumbs-specific
 *   divergence from `Link`'s required `href`.
 * - `selected` is a `DynamicBoolean` so it stays bindable per item in a template-generated trail;
 *   it marks the current page (`aria-current="page"`), static "current page" authoring state.
 * - `target` is the `a` host-element attribute, tightened to the `_self`/`_blank` enum; default
 *   (`_self`) lives in `catalog.json`.
 * - `accessibility` maps `label`/`description` onto `aria-label`/`aria-description` (the `Link`
 *   precedent).
 *
 * `to`, `as`, and the rest of the `a` host-element spread are dropped
 * (see _dev/docs/new-components/breadcrumbs-item.md). `.strict()` forbids any prop outside this
 * surface.
 */
export const BreadcrumbsItemApi = {
  name: 'BreadcrumbsItem',
  schema: z
    .object({
      label: CommonSchemas.DynamicString,
      href: CommonSchemas.DynamicString.optional(),
      selected: CommonSchemas.DynamicBoolean.optional(),
      target: z.enum(['_self', '_blank']).optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type BreadcrumbsItemProps = z.infer<typeof BreadcrumbsItemApi.schema>;
