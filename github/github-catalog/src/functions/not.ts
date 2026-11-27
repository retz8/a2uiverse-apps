import {z} from 'zod';
import {createFunctionImplementation, NotImplementation} from '@a2ui/web_core/v0_9';

/**
 * The basic catalog's logical `not`, adopted per task 7.9. Args authored here, `execute` delegated
 * to `@a2ui/web_core`.
 *
 * The inverter that turns a validator into a disabled state: `disabled` bound to
 * `not(required(...))` keeps a submit control inert until its field is filled, entirely on the
 * client. The delegate reads its arg as the protocol reads a boolean: a boolean as it is, a
 * validation result as its `valid`, a string as true only when it reads "true", a number as true
 * when it is not zero, anything else as false. `value` stays `z.any()` narrowed by a refine — the
 * resolved arg may be any of those, not strictly a boolean, and the refine is what keeps the arg
 * required.
 */
export const not = createFunctionImplementation(
  {
    name: 'not',
    returnType: 'boolean',
    schema: z.object({value: z.any().refine(v => v !== undefined, 'Required')}),
  },
  (args, context, abortSignal) => NotImplementation.execute(args, context, abortSignal) as boolean,
);
