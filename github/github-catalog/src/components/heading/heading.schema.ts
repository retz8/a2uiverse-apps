import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Heading, props-only.
 *
 * - `text` is the synthetic content prop (Primer Heading takes content via React
 *   children, but A2UI children are component IDs, so content needs a value prop).
 * - `as` selects the semantic heading level (documented default `"h2"`); `variant`
 *   is the visual size, independent of the level.
 * - `.strict()` forbids any prop outside this surface.
 */
export const HeadingApi = {
  name: 'Heading',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      as: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']).optional(),
      variant: z.enum(['large', 'medium', 'small']).optional(),
    })
    .strict(),
} as const;

export type HeadingProps = z.infer<typeof HeadingApi.schema>;
