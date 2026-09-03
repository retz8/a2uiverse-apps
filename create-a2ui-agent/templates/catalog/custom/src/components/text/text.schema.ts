import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of the seed `Text` component, props-only. Mirrors
 * `catalogs/v0.9.1/catalog.json` — the parity test keeps the two in lockstep.
 *
 * - `text` is bound runtime state, so it composes `DynamicString`.
 * - `variant` is fixed configuration, so it stays a plain enum.
 * - `.strict()` forbids any prop outside this surface.
 */
export const TextApi = {
  name: 'Text',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      variant: z.enum(['h1', 'h2', 'h3', 'body', 'caption']).optional(),
    })
    .strict(),
} as const;

export type TextProps = z.infer<typeof TextApi.schema>;
