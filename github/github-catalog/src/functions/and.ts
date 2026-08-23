import {z} from 'zod';
import {createFunctionImplementation, AndImplementation} from '@a2ui/web_core/v0_9';

/**
 * The basic catalog's logical `and`, adopted per task 7.9. Args authored here, `execute` delegated
 * to `@a2ui/web_core`.
 *
 * `values` takes at least two entries, each of which may itself be a function call — this is how
 * several validators compose into one bound boolean (e.g. a submit button enabled only when every
 * field passes). Entries are `z.any()` because the wire form of each is a DynamicBoolean: a
 * literal, a data-model path, or a nested call, all resolved before `execute` sees them.
 */
export const and = createFunctionImplementation(
  {
    name: 'and',
    returnType: 'boolean',
    schema: z.object({values: z.array(z.any()).min(2)}),
  },
  (args, context, abortSignal) => AndImplementation.execute(args, context, abortSignal) as boolean,
);
