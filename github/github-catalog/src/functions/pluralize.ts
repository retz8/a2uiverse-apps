import {z} from 'zod';
import {createFunctionImplementation, PluralizeImplementation} from '@a2ui/web_core/v0_9';
import {CoercedRequiredString} from '../shared/coerced-args';

/**
 * The basic catalog's `pluralize`, adopted per task 7.9. Args authored here, `execute` delegated
 * to `@a2ui/web_core`'s default-locale implementation.
 *
 * `other` is the required fallback; the remaining categories are optional because which ones apply
 * is locale-dependent (`two`/`few`/`many` are inert in English).
 */
export const pluralize = createFunctionImplementation(
  {
    name: 'pluralize',
    returnType: 'string',
    schema: z.object({
      value: z.coerce.number(),
      zero: z.coerce.string().optional(),
      one: z.coerce.string().optional(),
      two: z.coerce.string().optional(),
      few: z.coerce.string().optional(),
      many: z.coerce.string().optional(),
      other: CoercedRequiredString,
    }),
  },
  (args, context, abortSignal) =>
    PluralizeImplementation.execute(args, context, abortSignal) as string,
);
