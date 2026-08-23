import {z} from 'zod';
import {createFunctionImplementation} from '@a2ui/web_core/v0_9';

/**
 * A local client-side effect function. The Phase 2 functionCall path terminates here.
 * zod arg is the RESOLVED `message: string`; the catalog.json wire form types it as a
 * DynamicString (literal or binding) — see _dev/docs/a2ui-findings.md.
 */
export const consoleLog = createFunctionImplementation(
  {
    name: 'consoleLog',
    returnType: 'void',
    schema: z.object({message: z.string()}),
  },
  ({message}) => {
    console.log('[A2UI]', message);
  },
);
