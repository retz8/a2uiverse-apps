import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {responsive} from '../../shared/responsive';

/**
 * Runtime (zod) representation of Primer AvatarStack, props-only. A pure display container:
 * a set of overlapping avatars shown inline to represent a group of users or entities compactly.
 *
 * - `children` is the synthetic content channel, typed `CommonSchemas.ChildList` (a static array
 *   of component ids, or a `{componentId, path}` dynamic template) — required, faithful to
 *   Primer's required `children`. The children are `Avatar` leaves.
 * - `size` carries its full `ResponsiveValue<number>` union via `responsive()` (the standing
 *   convention from Stack): the scalar `number` arm plus a `{narrow, regular, wide}` map. When
 *   unset the stack derives its size from the children's own `size` props.
 * - `alignRight`/`disableExpand` are plain booleans; `variant`/`shape` are curated enums.
 * - Defaults (`variant = "cascade"`, `shape = "circle"`, falsy booleans) live in `catalog.json`,
 *   never as a zod `.default()`.
 * - `.strict()` forbids any prop outside this surface (the Primer type is a closed object with no
 *   HTML-attribute spread, so there is no accessibility channel to carry).
 */
export const AvatarStackApi = {
  name: 'AvatarStack',
  schema: z
    .object({
      children: CommonSchemas.ChildList,
      alignRight: z.boolean().optional(),
      disableExpand: z.boolean().optional(),
      variant: z.enum(['cascade', 'stack']).optional(),
      shape: z.enum(['circle', 'square']).optional(),
      size: responsive(z.number()).optional(),
    })
    .strict(),
} as const;

export type AvatarStackProps = z.infer<typeof AvatarStackApi.schema>;
