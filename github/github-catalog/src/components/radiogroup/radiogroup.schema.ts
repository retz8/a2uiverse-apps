import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `RadioGroup` (the root of the compound family, 6.49),
 * props-only. Groups a set of radio inputs under a shared label so the user selects a single option
 * from the group.
 *
 * No new infra: RadioGroup renders through the normal adapter->renderer path. Its `children` are
 * slot-scanned exactly as `FormControl`'s and `Dialog`'s are (`CommonSchemas.ChildList`) — the
 * renderer passes the real Primer subcomponents (`RadioGroup.Label` / `.Caption` / `.Validation`)
 * and the radio inputs through as children, and Primer's own slot machinery does the
 * label/caption/validation association plus the `RadioGroupContext` wiring (shared `name` +
 * selection `onChange`). See `radio-group.md`.
 *
 * - `children` (required) -> `ChildList`: the group's label, an optional caption / validation
 *   message, and the radio inputs.
 * - `name` (required) -> plain `z.string()`: the group key; the radios sharing this name are
 *   mutually exclusive.
 * - `action` (synthetic <- Primer `onChange`) -> `Action`: performed when the selected radio in the
 *   group changes; the binder resolves it to a ready-to-call () => void (event vs functionCall
 *   routing is the renderer's job).
 * - `disabled` -> `DynamicBoolean`: whether the whole group is disabled and no option can be
 *   selected.
 * - `required` -> fixed authoring-time config (`z.boolean()`), matching the sibling
 *   `FormControl.required`: whether a selection must be made before the containing form can be
 *   submitted.
 * - `aria-labelledby` -> literal idref `z.string()`: the external-label escape hatch, used only when
 *   the group is labeled by something other than its own `RadioGroup.Label` (the label<->group
 *   association is otherwise automatic via `<fieldset>`/`<legend>` + context).
 *
 * Dropped/deferred: `id` (framework-owned envelope field consumed as the component's identity, so it
 * can never reach the props object, per `catalog.parity.test.ts`); `data-component` (Primer identity
 * marker); `className`/`style` (styling passthroughs).
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const RadioGroupApi = {
  name: 'RadioGroup',
  schema: z
    .object({
      children: CommonSchemas.ChildList,
      name: z.string(),
      action: CommonSchemas.Action.optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
      required: z.boolean().optional(),
      'aria-labelledby': z.string().optional(),
    })
    .strict(),
} as const;

export type RadioGroupProps = z.infer<typeof RadioGroupApi.schema>;
