import {z} from 'zod';
import {createFunctionImplementation} from '@a2ui/web_core/v0_9';

/**
 * A local client-side function that counts the items of a list whose `selected` field is true.
 * The registry's first value-returning function — motivated by the review-queue flow: a counter
 * summarizing a multi-select list must update on each toggle without an agent round-trip, and the
 * data model has no computed values of its own. Bound as a `{call}` value (e.g. on
 * `CounterLabel.count`) with `items` bound to the list's path, it re-evaluates reactively: a write
 * to any item's `selected` notifies the list's ancestor signal, which re-resolves the argument.
 *
 * zod arg is the RESOLVED list; the catalog.json wire form types it as a DynamicValue path.
 */
export const countSelected = createFunctionImplementation(
  {
    name: 'countSelected',
    returnType: 'number',
    schema: z.object({items: z.array(z.unknown())}),
  },
  ({items}) => items.filter(item => Boolean((item as {selected?: unknown})?.selected)).length,
);
