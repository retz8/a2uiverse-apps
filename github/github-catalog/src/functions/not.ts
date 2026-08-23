import {z} from 'zod';
import {createFunctionImplementation, NotImplementation} from '@a2ui/web_core/v0_9';

/**
 * The basic catalog's logical `not`, adopted per task 7.9. Args authored here, `execute` delegated
 * to `@a2ui/web_core`.
 *
 * The inverter that turns a validator into a disabled state: `disabled` bound to
 * `not(required(...))` keeps a submit control inert until its field is filled, entirely on the
 * client. `value` stays `z.any()` narrowed by a refine — the resolved arg may be any truthy value,
 * not strictly a boolean, and the refine is what keeps the arg required.
 */
export const not = createFunctionImplementation(
  {
    name: 'not',
    returnType: 'boolean',
    schema: z.object({value: z.any().refine(v => v !== undefined, 'Required')}),
  },
  (args, context, abortSignal) => NotImplementation.execute(args, context, abortSignal) as boolean,
);
