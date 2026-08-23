import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Text, props-only.
 *
 * - `text` is the synthetic content prop (Primer Text takes content via React
 *   children, but A2UI children are component IDs, so content needs a value prop).
 * - `as`/`size`/`weight`/`whiteSpace` are Primer's real prop surface, lifted verbatim.
 *   `weight` is Primer's FONT weight (the protocol's layout `weight` is intentionally
 *   not carried — see _dev/docs/a2ui-findings.md).
 * - `.strict()` forbids any prop outside this surface.
 */
export const TextApi = {
  name: 'Text',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      as: z.enum(['span', 'p', 'div', 'label', 'strong', 'em', 'small']).optional(),
      size: z.enum(['small', 'medium', 'large']).optional(),
      weight: z.enum(['light', 'normal', 'medium', 'semibold']).optional(),
      whiteSpace: z.enum(['normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line']).optional(),
    })
    .strict(),
} as const;

export type TextProps = z.infer<typeof TextApi.schema>;
