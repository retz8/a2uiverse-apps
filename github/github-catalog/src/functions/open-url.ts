import {z} from 'zod';
import {createFunctionImplementation, OpenUrlImplementation} from '@a2ui/web_core/v0_9';
import {CoercedRequiredString} from '../shared/coerced-args';

/**
 * The basic catalog's `openUrl`, adopted per task 7.9. Args authored here, `execute` delegated to
 * `@a2ui/web_core`, which opens the URL in a new window/tab.
 *
 * The one adopted function matching the action-effect shape the existing five already use: it is
 * fired from a component's `action`, not bound as a value. In this catalog's domain it is how a
 * surface leaves for github.com without a round trip through the agent.
 */
export const openUrl = createFunctionImplementation(
  {
    name: 'openUrl',
    returnType: 'void',
    schema: z.object({
      url: CoercedRequiredString,
    }),
  },
  (args, context, abortSignal) => {
    OpenUrlImplementation.execute(args, context, abortSignal);
  },
);
