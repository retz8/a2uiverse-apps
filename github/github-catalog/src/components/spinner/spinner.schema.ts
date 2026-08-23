import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Spinner, props-only.
 *
 * - `size` is Primer's real size enum; its documented default (`medium`) surfaces
 *   only in catalog.json, not here.
 * - `srText` is Primer's assistive-technology label, carried as a `DynamicString` so it
 *   can be data-bound. It is `nullable`: `null` suppresses the hidden text when a visible
 *   text node elsewhere announces the loading state. The documented default (`"Loading"`)
 *   surfaces only in catalog.json.
 * - `delay` is a lifted enum over Primer's `boolean | 'short' | 'long' | number` prop —
 *   only the authorable arms (`none`/`short`/`long`) are carried; `none` maps to no delay.
 *   Its documented default (`none`) surfaces only in catalog.json.
 * - Spinner is a pure display leaf: no `Action`, no children, no local function.
 * - `.strict()` forbids any prop outside this surface.
 */
export const SpinnerApi = {
  name: 'Spinner',
  schema: z
    .object({
      size: z.enum(['small', 'medium', 'large']).optional(),
      srText: CommonSchemas.DynamicString.nullable().optional(),
      delay: z.enum(['none', 'short', 'long']).optional(),
    })
    .strict(),
} as const;

export type SpinnerProps = z.infer<typeof SpinnerApi.schema>;
