import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer NavList.Group, props-only. A container that groups related
 * navigation items under a heading.
 *
 * - `children` is the synthetic content channel — the grouped navigation items — typed
 *   `CommonSchemas.ChildList` (optional).
 * - `title` carries the group's heading text (`DynamicString`); `Group.title` and the
 *   `NavList.GroupHeading` leaf are two faithful ways to label a group.
 * - `.strict()` forbids any prop outside this surface (`className`, `style`, and the rest of the
 *   HTML-`<li>` attribute spread are dropped).
 */
export const NavListGroupApi = {
  name: 'NavList.Group',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      title: CommonSchemas.DynamicString.optional(),
    })
    .strict(),
} as const;

export type NavListGroupProps = z.infer<typeof NavListGroupApi.schema>;
