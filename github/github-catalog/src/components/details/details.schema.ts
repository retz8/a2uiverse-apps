import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Details, props-only.
 *
 * A disclosure: a summary the user clicks to reveal or hide a body of content. Primer expresses
 * this as positional children (`[<summary>, ...body]`); the A2UI leaf lifts that into two named
 * synthetic slots — `summary` (a ComponentId rendered inside `Details.Summary`) and `children`
 * (a ChildList, the collapsible body).
 *
 * - `summary` is the always-visible label -> ComponentId (required; Primer warns without one).
 * - `children` is the collapsible content -> ChildList (optional).
 * - `open` is the sole controlled state -> DynamicBoolean (required, the input-component
 *   convention: Checkbox/Radio/ToggleSwitch). Two-way bound: the binder auto-generates
 *   `setOpen`, and a summary toggle or an outside-click writes the new state back to the bound
 *   data-model path. There is no separate `onToggle` Action — the state change *is* the
 *   write-back, exactly as Checkbox folds `onChange` into `checked`.
 * - `closeOnOutsideClick` is fixed configuration -> plain boolean (default false in catalog.json,
 *   never a zod `.default()`); it is a `useDetails` param the canonical Primer example exercises.
 * - `onClickOutside` is the action performed on an outside click -> Action.
 * - `accessibility` is carried because Details spreads native `<details>` attributes (the aria-*
 *   slice); it maps to CommonSchemas.AccessibilityAttributes.
 *
 * Dropped/deferred: `onToggle` (represented by the two-way binding on `open`), `defaultOpen`
 * (the bound `open` path's initial value owns initial state, as Checkbox drops `defaultChecked`),
 * `ref` (useDetails caller ref — internal render wiring), `className`/`style`/`data-component`
 * and the non-aria `<details>` HTML-attribute tail (no A2UI representation).
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const DetailsApi = {
  name: 'Details',
  schema: z
    .object({
      summary: CommonSchemas.ComponentId,
      children: CommonSchemas.ChildList.optional(),
      open: CommonSchemas.DynamicBoolean,
      closeOnOutsideClick: z.boolean().optional(),
      onClickOutside: CommonSchemas.Action.optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type DetailsProps = z.infer<typeof DetailsApi.schema>;
