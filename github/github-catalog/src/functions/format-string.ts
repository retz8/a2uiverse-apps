import {z} from 'zod';
import {createFunctionImplementation, FormatStringImplementation} from '@a2ui/web_core/v0_9';
import {CoercedRequiredString} from '../shared/coerced-args.js';

/**
 * The basic catalog's `formatString` interpolation engine, adopted per task 7.9. Args authored
 * here, `execute` delegated to `@a2ui/web_core`.
 *
 * This is the one function whose declared `returnType` diverges from the upstream implementation:
 * `@a2ui/web_core` declares `any`, the published basic catalog.json declares `string`, and we
 * follow the catalog. `returnType` is a declaration the AGENT reads, and `any` tells the model
 * nothing about what it can bind the result to. Behavior is untouched.
 *
 * `execute` returns a computed signal, not a plain string — the implementation parses `${...}`
 * blocks in `value`, resolves each data path and nested function call against the data context,
 * and returns a reactive stream so the text repaints when any dependency changes. The cast below
 * states the declared return type; the renderer unwraps the signal.
 */
export const formatString = createFunctionImplementation(
  {
    name: 'formatString',
    returnType: 'string',
    schema: z.object({value: CoercedRequiredString}),
  },
  (args, context, abortSignal) =>
    FormatStringImplementation.execute(args, context, abortSignal) as string,
);
