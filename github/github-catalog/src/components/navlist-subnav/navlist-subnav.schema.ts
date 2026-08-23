import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer NavList.SubNav, props-only. The nested navigation items
 * shown when a parent item is expanded.
 *
 * - `children` is the synthetic content channel — the nested navigation items — typed
 *   `CommonSchemas.ChildList` (optional).
 * - `.strict()` forbids any prop outside this surface (`as`, whose only meaningful value is `'ul'`,
 *   is dropped).
 */
export const NavListSubNavApi = {
  name: 'NavList.SubNav',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
    })
    .strict(),
} as const;

export type NavListSubNavProps = z.infer<typeof NavListSubNavApi.schema>;
