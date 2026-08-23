import {z} from 'zod';
import {createFunctionImplementation, EmailImplementation} from '@a2ui/web_core/v0_9';
import {CoercedRequiredString} from '../shared/coerced-args.js';

/**
 * The basic catalog's `email` validator, adopted per task 7.9. Args authored here, `execute`
 * delegated to `@a2ui/web_core` (a deliberately simple regex shape check, per its own note).
 */
export const email = createFunctionImplementation(
  {
    name: 'email',
    returnType: 'boolean',
    schema: z.object({
      value: CoercedRequiredString,
    }),
  },
  (args, context, abortSignal) =>
    EmailImplementation.execute(args, context, abortSignal) as boolean,
);
