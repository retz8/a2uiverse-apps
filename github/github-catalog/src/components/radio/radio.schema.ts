import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Radio, props-only.
 *
 * Faithful 1:1 translation of Primer Radio's real prop surface (from
 * `@primer/react` `Radio.d.ts`, reconciled against `Radio.js`, which renders a bare native
 * `<input type="radio">`):
 * - `value` is the required per-option identifier; never shown to the user -> plain z.string().
 * - `name` is the group key; radios sharing a `name` are mutually exclusive -> plain z.string().
 * - `checked`/`disabled` are bound runtime state -> DynamicBoolean.
 * - `required` is fixed form configuration -> plain z.boolean().
 * - `action` is Primer's onChange expressed as the A2UI Action; the binder resolves it to a
 *   ready-to-call () => void (event vs functionCall routing is the renderer's job).
 * - `accessibility` carries the aria-* slice of Radio's spread InputHTMLAttributes; a radio
 *   renders no visible label of its own, so this is how a label reaches assistive tech.
 *
 * Dropped/deferred (produce no schema line): `defaultChecked` (uncontrolled alias of `checked`),
 * `ref`, `className`/`style`, and the rest of the non-aria InputHTMLAttributes spread.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const RadioApi = {
  name: 'Radio',
  schema: z
    .object({
      value: z.string(),
      name: z.string().optional(),
      checked: CommonSchemas.DynamicBoolean.optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
      required: z.boolean().optional(),
      action: CommonSchemas.Action.optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type RadioProps = z.infer<typeof RadioApi.schema>;
