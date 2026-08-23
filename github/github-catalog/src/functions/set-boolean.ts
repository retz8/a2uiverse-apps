import {z} from 'zod';
import {createFunctionImplementation} from '@a2ui/web_core/v0_9';

/**
 * A local client-side function that writes a boolean to a data-model path. Joins
 * `clearValue` as a data-model writer — motivated by the overlay family: a dialog's own
 * "Close" button, or a disclosure's toggle, changes only what is already on screen, but a
 * button cannot reach another component's visibility state, so it is a write to the bound
 * path. `Dialog`, `ActionMenu`, `AnchoredOverlay`, `Details`, `Popover` and `SelectPanel`
 * all expose `open` as a two-way-bound `DynamicBoolean`, so one function serves them all:
 * `execute` calls `.set(path, value)`, the same write the built-in dismissal performs, and
 * the component — subscribed to that path — opens or closes.
 *
 * Both directions are deliberate. Closing is the motivating case, but the identical write
 * with `true` opens a surface that is already composed, which is the other half of keeping
 * on-screen state changes off the wire.
 *
 * zod args are the RESOLVED `path: string` / `value: boolean`; the catalog.json wire form
 * types them as a DynamicString and a DynamicBoolean.
 */
export const setBoolean = createFunctionImplementation(
  {
    name: 'setBoolean',
    returnType: 'void',
    schema: z.object({path: z.string(), value: z.boolean()}),
  },
  ({path, value}, context) => {
    context.set(path, value);
  },
);
