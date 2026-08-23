import {z} from 'zod';
import {createFunctionImplementation, NumericImplementation} from '@a2ui/web_core/v0_9';

/**
 * The basic catalog's `numeric` range validator, adopted per task 7.9. Args authored here,
 * `execute` delegated to `@a2ui/web_core`.
 *
 * As with `length`, the upstream object-level refine ("must provide either min or max") is not
 * reproduced — it would make the schema a `ZodEffects` and break the parity test's `.shape` read.
 * The implementation returns `true` when both bounds are absent; the constraint lives in the
 * catalog.json description.
 */
export const numeric = createFunctionImplementation(
  {
    name: 'numeric',
    returnType: 'boolean',
    schema: z.object({
      value: z.coerce.number(),
      min: z.coerce.number().optional(),
      max: z.coerce.number().optional(),
    }),
  },
  (args, context, abortSignal) =>
    NumericImplementation.execute(args, context, abortSignal) as boolean,
);
