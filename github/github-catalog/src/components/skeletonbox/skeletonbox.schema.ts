import {z} from 'zod';

/**
 * Runtime (zod) representation of Primer SkeletonBox, props-only.
 *
 * - `height`/`width` are fixed authoring-time geometry (plain CSS length strings, not
 *   `Dynamic*`); `width` fills the container when unset, `height` defaults to `1rem`.
 * - `delay` is Primer's delay narrowed to an enum: the raw millisecond arm carries no
 *   authoring-time signal, so only the `none`/`short`/`long` keywords are projected.
 * - SkeletonBox is a pure display leaf — no content channel, no `Action`, no
 *   `ComponentId`, no accessibility surface (it renders a single empty shimmering div).
 * - `.strict()` forbids any prop outside this surface.
 */
export const SkeletonBoxApi = {
  name: 'SkeletonBox',
  schema: z
    .object({
      height: z.string().optional(),
      width: z.string().optional(),
      delay: z.enum(['none', 'short', 'long']).optional(),
    })
    .strict(),
} as const;

export type SkeletonBoxProps = z.infer<typeof SkeletonBoxApi.schema>;
