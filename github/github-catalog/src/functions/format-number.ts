import {z} from 'zod';
import {createFunctionImplementation, FormatNumberImplementation} from '@a2ui/web_core/v0_9';

/**
 * The basic catalog's `formatNumber`, adopted per task 7.9. Args authored here, `execute`
 * delegated to `@a2ui/web_core`'s default-locale implementation (the upstream module also exposes
 * a locale-closure factory; the adapter ships the default, matching the rest of the catalog's
 * locale-agnostic surface).
 *
 * `grouping` carries `.default(true)` rather than `.optional()`, mirroring upstream — the default
 * has to be applied at parse time because the implementation reads the resolved arg.
 */
export const formatNumber = createFunctionImplementation(
  {
    name: 'formatNumber',
    returnType: 'string',
    schema: z.object({
      value: z.coerce.number(),
      decimals: z.coerce.number().optional(),
      grouping: z.boolean().default(true),
    }),
  },
  (args, context, abortSignal) =>
    FormatNumberImplementation.execute(args, context, abortSignal) as string,
);
