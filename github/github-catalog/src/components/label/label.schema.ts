import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Label, props-only.
 *
 * - `text` is the synthetic content prop (Primer Label takes content via React
 *   children, but A2UI children are component IDs, so content needs a value prop).
 * - `variant`/`size` are Primer's real prop surface, lifted verbatim. Their
 *   documented defaults ("default"/"small") surface only in catalog.json, not here.
 * - `.strict()` forbids any prop outside this surface.
 */
export const LabelApi = {
  name: 'Label',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      variant: z
        .enum([
          'default',
          'primary',
          'secondary',
          'accent',
          'success',
          'attention',
          'severe',
          'danger',
          'done',
          'sponsors',
        ])
        .optional(),
      size: z.enum(['small', 'large']).optional(),
    })
    .strict(),
} as const;

export type LabelProps = z.infer<typeof LabelApi.schema>;
