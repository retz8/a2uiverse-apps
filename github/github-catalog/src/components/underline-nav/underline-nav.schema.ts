import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer UnderlineNav (the root), props-only. The root of the
 * UnderlineNav compound family — a horizontal row of navigation tabs indicating the current page
 * with an underline.
 *
 * - `children` is the synthetic content channel — the navigation items (`UnderlineNav.Item`) — typed
 *   `CommonSchemas.ChildList`, carried required (the installed type and the doc both require it,
 *   the ActionBar/AvatarStack precedent).
 * - `aria-label` carries the nav landmark's accessible name as a literal `DynamicString`, carried
 *   required (doc-required, code-enforced invariant — the NavList/PageHeader family convention).
 * - `loadingCounters` is bound runtime state -> `DynamicBoolean` (default `false` in catalog.json).
 * - `variant` is the visual density enum (default `inset` in catalog.json).
 * - `.strict()` forbids any prop outside this surface (`as`, `className`, and the rest of the
 *   non-`aria-*` host-element spread are dropped).
 */
export const UnderlineNavApi = {
  name: 'UnderlineNav',
  schema: z
    .object({
      children: CommonSchemas.ChildList,
      'aria-label': CommonSchemas.DynamicString,
      loadingCounters: CommonSchemas.DynamicBoolean.optional(),
      variant: z.enum(['inset', 'flush']).optional(),
    })
    .strict(),
} as const;

export type UnderlineNavProps = z.infer<typeof UnderlineNavApi.schema>;
