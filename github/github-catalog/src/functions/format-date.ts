import {z} from 'zod';
import {createFunctionImplementation, FormatDateImplementation} from '@a2ui/web_core/v0_9';
import {CoercedRequiredString} from '../shared/coerced-args';

/**
 * The basic catalog's `formatDate`, adopted per task 7.9. Args authored here, `execute` delegated
 * to `@a2ui/web_core`.
 *
 * `value` accepts anything date-like (an ISO string, a timestamp, a Date) so it stays `z.any()`
 * narrowed by a refine to keep the arg required. `format` is a Unicode TR35 pattern — the pattern
 * vocabulary lives in the catalog.json description, which is where the agent reads it.
 */
export const formatDate = createFunctionImplementation(
  {
    name: 'formatDate',
    returnType: 'string',
    schema: z.object({
      value: z.any().refine(v => v !== undefined, 'Required'),
      format: CoercedRequiredString,
    }),
  },
  (args, context, abortSignal) =>
    FormatDateImplementation.execute(args, context, abortSignal) as string,
);
