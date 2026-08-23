import {z} from 'zod';
import {createFunctionImplementation, OrImplementation} from '@a2ui/web_core/v0_9';

/**
 * The basic catalog's logical `or`, adopted per task 7.9. Args authored here, `execute` delegated
 * to `@a2ui/web_core`. Same two-entry minimum and same nested-call composition as `and`.
 */
export const or = createFunctionImplementation(
  {
    name: 'or',
    returnType: 'boolean',
    schema: z.object({values: z.array(z.any()).min(2)}),
  },
  (args, context, abortSignal) => OrImplementation.execute(args, context, abortSignal) as boolean,
);
