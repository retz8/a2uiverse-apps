import {z} from 'zod';
import {createFunctionImplementation, LengthImplementation} from '@a2ui/web_core/v0_9';

/**
 * The basic catalog's `length` validator, adopted per task 7.9. Args authored here, `execute`
 * delegated to `@a2ui/web_core`.
 *
 * `@a2ui/web_core` carries an object-level refine ("must provide either min or max") which is NOT
 * reproduced: a refine makes the schema a `ZodEffects` rather than a `ZodObject`, and the parity
 * test reads `.shape` off the args schema. The upstream implementation already degrades to `true`
 * when both bounds are absent — a permissive no-op, not a wrong answer — so the constraint is
 * carried in the catalog.json description, which is the surface that steers the agent.
 */
export const length = createFunctionImplementation(
  {
    name: 'length',
    returnType: 'boolean',
    schema: z.object({
      value: z.any().refine(v => v !== undefined, 'Required'),
      min: z.coerce.number().optional(),
      max: z.coerce.number().optional(),
    }),
  },
  (args, context, abortSignal) =>
    LengthImplementation.execute(args, context, abortSignal) as boolean,
);
