import {z} from 'zod';
import {createFunctionImplementation} from '@a2ui/web_core/v0_9';

/**
 * A local client-side function that clears a data-model path (sets it to the empty string). Joins
 * `consoleLog`/`windowAlert` in the registry — motivated by `TextInput`'s trailing "Clear" action:
 * a button can't own another component's value, so clearing an input is a write to the value's
 * bound path. `execute` receives the `DataContext` as its second argument and calls `.set(path, '')`,
 * the same data-model write the input's own two-way binding performs on edit; the input, subscribed
 * to that path, re-renders empty.
 *
 * zod arg is the RESOLVED `path: string`; the catalog.json wire form types it as a DynamicString.
 */
export const clearValue = createFunctionImplementation(
  {
    name: 'clearValue',
    returnType: 'void',
    schema: z.object({path: z.string()}),
  },
  ({path}, context) => {
    context.set(path, '');
  },
);
