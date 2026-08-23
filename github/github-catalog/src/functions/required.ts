import {z} from 'zod';
import {createFunctionImplementation, RequiredImplementation} from '@a2ui/web_core/v0_9';

/**
 * The basic catalog's `required` validator, adopted per task 7.9. The args schema is authored
 * here (so the zod↔catalog.json parity gate checks an independently expressed schema) and
 * `execute` delegates to `@a2ui/web_core`'s implementation.
 *
 * `value` is deliberately `z.any()` narrowed by a refine rather than a typed schema: the check is
 * "is anything there", so it must accept a string, a number, a list or an object and reject only
 * `undefined`. The refine is what keeps the arg required — a bare `z.any()` accepts `undefined`.
 */
export const required = createFunctionImplementation(
  {
    name: 'required',
    returnType: 'boolean',
    schema: z.object({value: z.any().refine(v => v !== undefined, 'Required')}),
  },
  (args, context, abortSignal) =>
    RequiredImplementation.execute(args, context, abortSignal) as boolean,
);
