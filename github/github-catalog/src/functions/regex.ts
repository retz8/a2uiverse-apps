import {z} from 'zod';
import {createFunctionImplementation, RegexImplementation} from '@a2ui/web_core/v0_9';
import {CoercedRequiredString} from '../shared/coerced-args.js';

/**
 * The basic catalog's `regex` validator, adopted per task 7.9. Args authored here, `execute`
 * delegated to `@a2ui/web_core`. Both args are required strings that still coerce — see
 * `CoercedRequiredString`.
 */
export const regex = createFunctionImplementation(
  {
    name: 'regex',
    returnType: 'boolean',
    schema: z.object({value: CoercedRequiredString, pattern: CoercedRequiredString}),
  },
  (args, context, abortSignal) =>
    RegexImplementation.execute(args, context, abortSignal) as boolean,
);
