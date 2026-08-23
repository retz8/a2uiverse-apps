import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Avatar, props-only.
 *
 * Avatar is a pure display leaf: a void `<img>` representing a user or a non-human
 * entity such as an organization, team, or bot — typically a profile picture. No
 * `Action`, no `ComponentId`, no children.
 *
 * - `src` is the required content prop: the URL of the avatar image, carried as a
 *   DynamicString so it can be literal or path-bound.
 * - `alt` is the accessibility channel for the image (DynamicString); no separate
 *   `accessibility` is carried — `alt` would duplicate it for a non-interactive image.
 * - `size`/`square` are Primer's real prop surface. `size` is the plain `number` half of
 *   Primer's `number | ResponsiveValue<number>` union (the viewport-conditional object
 *   form has no A2UI representation and is dropped).
 * - `.strict()` forbids any prop outside this surface. A `(default: X)` annotation
 *   surfaces only in catalog.json, never as a zod `.default()`.
 */
export const AvatarApi = {
  name: 'Avatar',
  schema: z
    .object({
      src: CommonSchemas.DynamicString,
      alt: CommonSchemas.DynamicString.optional(),
      size: z.number().optional(),
      square: z.boolean().optional(),
    })
    .strict(),
} as const;

export type AvatarProps = z.infer<typeof AvatarApi.schema>;
