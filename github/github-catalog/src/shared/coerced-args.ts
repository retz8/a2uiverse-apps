import {z} from 'zod';

/**
 * A required string function-arg that coerces without swallowing absence.
 *
 * The catalog invoker parses a function's args on every invocation and throws on failure, so an
 * agent emitting a number where a string is declared must coerce rather than break the render.
 * `z.coerce.string()` does that, but it also accepts `undefined` — `String(undefined)` is the
 * string `"undefined"`, which parses fine — so a REQUIRED arg declared that way silently renders
 * the text "undefined" instead of failing. The preprocess below passes `undefined` through
 * untouched so it still fails the inner `z.string()`, while coercing everything else.
 *
 * Used by the basic-catalog functions adopted in task 7.9 whose string args are required. Optional
 * string args need none of this: `.optional()` short-circuits on `undefined` before coercion.
 */
export const CoercedRequiredString = z.preprocess(
  v => (v === undefined ? undefined : String(v)),
  z.string(),
);
