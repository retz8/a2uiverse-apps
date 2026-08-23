import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer CounterLabel, props-only.
 *
 * - `count` is the synthetic content prop (Primer CounterLabel takes content via React
 *   children, but A2UI children are component IDs, so content needs a value prop). It is a
 *   DynamicNumber — a count is numeric — so it also admits a number-returning function call
 *   (e.g. `countSelected` over a multi-select list).
 * - `variant` is Primer's real emphasis enum, lifted verbatim. Primer's deprecated
 *   `scheme` alias is dropped (see the decision doc); `variant` carries the same enum.
 * - `.strict()` forbids any prop outside this surface.
 */
export const CounterLabelApi = {
  name: 'CounterLabel',
  schema: z
    .object({
      count: CommonSchemas.DynamicNumber,
      variant: z.enum(['primary', 'secondary']).optional(),
    })
    .strict(),
} as const;

export type CounterLabelProps = z.infer<typeof CounterLabelApi.schema>;
