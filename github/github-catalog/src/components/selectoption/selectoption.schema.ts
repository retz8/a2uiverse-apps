import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Select.Option, props-only. The option leaf for Select
 * (component name `SelectOption`).
 *
 * - `text` is the synthetic visible-label channel — `carry (required)`, typed `DynamicString` so
 *   an option set can be generated from a bound data array via the ChildList dynamic template.
 * - `value` is the option's underlying value, matched against the select's selected value —
 *   `carry (required)`, typed `DynamicString` for the same template reason.
 * - `disabled` is bound runtime state -> DynamicBoolean.
 *
 * Dropped/deferred (no A2UI representation): `selected` (selection is controlled by the parent
 * select's two-way-bound `value`), `label`/`id`/`hidden`/`className`/`style` and the rest of the
 * non-`aria-*` `HTMLOptionElement` spread. `accessibility` is not carried: an option is a content
 * leaf whose visible text is its accessible name (per-component fidelity, as with Text).
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const SelectOptionApi = {
  name: 'SelectOption',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      value: CommonSchemas.DynamicString,
      disabled: CommonSchemas.DynamicBoolean.optional(),
    })
    .strict(),
} as const;

export type SelectOptionProps = z.infer<typeof SelectOptionApi.schema>;
