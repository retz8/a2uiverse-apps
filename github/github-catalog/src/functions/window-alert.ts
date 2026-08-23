import {z} from 'zod';
import {createFunctionImplementation} from '@a2ui/web_core/v0_9';

/**
 * A local client-side effect function wrapping `window.alert`. A second general-purpose effect
 * joining `consoleLog` in the registry — motivated by Details' `onClickOutside` example (Primer's
 * own alerts on outside-click), but usable by any component's Action; it also proves the
 * functionCall path is general rather than console-log-only.
 *
 * zod arg is the RESOLVED `message: string`; the catalog.json wire form types it as a
 * DynamicString (literal or binding).
 */
export const windowAlert = createFunctionImplementation(
  {
    name: 'windowAlert',
    returnType: 'void',
    schema: z.object({message: z.string()}),
  },
  ({message}) => {
    window.alert(message);
  },
);
