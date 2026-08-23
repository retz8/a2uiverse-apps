import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `FormControl` (the root of the compound family, 6.47),
 * props-only. Wraps a single form input with its visible label, optional helper caption, and
 * optional validation message, laying them out and associating them for assistive technologies.
 *
 * No new infra: FormControl renders through the normal adapter->renderer path. Its `children` are
 * slot-scanned exactly as `Dialog`'s are (`CommonSchemas.ChildList`) — the renderer passes the real
 * Primer subcomponents (`FormControl.Label` / `.Caption` / `.Validation` / `.LeadingVisual`) and the
 * wrapped input through as children, and Primer's own `useSlots` does the label/caption/validation
 * association and layout. See `formcontrol.md`.
 *
 * - `children` (required) -> `ChildList`: the label, an optional caption / validation / leading
 *   visual, and the wrapped input control.
 * - `disabled` -> `DynamicBoolean`: whether the control is inactive.
 * - `layout` -> `z.enum(['horizontal','vertical'])` (default `"vertical"`, surfaced only in
 *   `catalog.json`): horizontal is used for checkbox and radio inputs.
 * - `required` -> fixed authoring-time config (`z.boolean()`), matching the sibling
 *   `TextInput.required`; drives the label's required indicator and the input's required semantics.
 *
 * The decision doc (`formcontrol.md`) also carried `id` (`z.string()`) to associate the label,
 * caption, and validation with the input. It is dropped here: `id` is a framework-owned envelope
 * field — the message processor destructures every component as `{id, component, ...properties}`, so
 * `id` is always consumed as the component's identity and can never reach the props object (the
 * `catalog.parity.test.ts` treats `id` as an envelope field for exactly this reason). Association
 * still works: Primer's `FormControl` falls back to a generated `useId`, wiring the label's `htmlFor`
 * to it via `FormControlContext`.
 *
 * The whole family emits no `Action`/event — it is a pure wrapper; state lives in the two-way
 * binding on the wrapped input. `.strict()` forbids any prop outside this surface;
 * `className`/`style` are dropped (styling passthroughs).
 */
export const FormControlApi = {
  name: 'FormControl',
  schema: z
    .object({
      children: CommonSchemas.ChildList,
      disabled: CommonSchemas.DynamicBoolean.optional(),
      layout: z.enum(['horizontal', 'vertical']).optional(),
      required: z.boolean().optional(),
    })
    .strict(),
} as const;

export type FormControlProps = z.infer<typeof FormControlApi.schema>;
