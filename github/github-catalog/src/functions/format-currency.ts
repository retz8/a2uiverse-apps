import {z} from 'zod';
import {createFunctionImplementation, FormatCurrencyImplementation} from '@a2ui/web_core/v0_9';
import {CoercedRequiredString} from '../shared/coerced-args.js';

/**
 * The basic catalog's `formatCurrency`, adopted per task 7.9. Args authored here, `execute`
 * delegated to `@a2ui/web_core`'s default-locale implementation.
 *
 * Adopted for completeness of the declared basic set rather than for a GitHub flow — no surface in
 * this catalog's domain renders money. It costs one entry and spares re-litigating the set later.
 */
export const formatCurrency = createFunctionImplementation(
  {
    name: 'formatCurrency',
    returnType: 'string',
    schema: z.object({
      value: z.coerce.number(),
      currency: CoercedRequiredString,
      decimals: z.coerce.number().optional(),
      grouping: z.boolean().default(true),
    }),
  },
  (args, context, abortSignal) =>
    FormatCurrencyImplementation.execute(args, context, abortSignal) as string,
);
