import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer NavList (the root), props-only. The root of the NavList
 * compound family — a vertical list of navigation links for the current context.
 *
 * - `children` is the synthetic content channel — the navigation items, groups, and dividers,
 *   typed `CommonSchemas.ChildList` (optional, faithful to Primer's `React.ReactNode` children).
 * - `aria-label` / `aria-labelledby` carry the nav landmark's accessible name as literal
 *   `DynamicString`s (following the PageHeader family) — the root is the sole family leaf whose
 *   documented props table lists aria attributes.
 * - `.strict()` forbids any prop outside this surface (`as`, `NavList.Heading`, `className`,
 *   `style`, and the rest of the non-`aria-*` HTML-`<nav>` attribute spread are dropped).
 */
export const NavListApi = {
  name: 'NavList',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      'aria-label': CommonSchemas.DynamicString.optional(),
      'aria-labelledby': CommonSchemas.DynamicString.optional(),
    })
    .strict(),
} as const;

export type NavListProps = z.infer<typeof NavListApi.schema>;
