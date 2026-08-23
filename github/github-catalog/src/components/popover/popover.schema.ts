import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `Popover` (the root), props-only. A floating content
 * container anchored near a related element, used to bring attention to it with brief contextual
 * content. Part of the `Popover` compound family (6.56) — see `popover.md`.
 *
 * Positioned element — no new infra (simpler than `Dialog`): Popover does not portal and has no
 * backdrop, focus trap, Escape handling, or body-scroll lock. It renders as a positioned wrapper
 * whose visuals are gated by `data-open` / `data-relative` / `data-caret` attributes, through the
 * normal adapter→renderer path (Primer's `Popover.module.css` semantics, mirrored on the chosen
 * `as` element).
 *
 * - `children` is tightened to REQUIRED: the popover's only content channel (typically a single
 *   `Popover.Content`); an empty popover renders nothing.
 * - `caret` is the pointing-arrow position; the code default is `"top"` (surfaced only in
 *   `catalog.json`).
 * - `open` is the controlled visibility state → `DynamicBoolean`, two-way bound like `Dialog`'s
 *   `open`: the binder auto-generates `setOpen`, so a bound path can be written from the agent to
 *   show/hide the popover. Absent (unbound) it is pure authoring-time visibility; unlike `Dialog`,
 *   Popover defaults CLOSED when `open` is absent (Primer's `open ? "" : undefined`).
 * - `relative` is fixed authoring-time configuration (a layout-strategy choice, never data-driven)
 *   → plain `z.boolean()` (default `false`).
 * - `as` narrows Primer's wrapper host element to the display-equivalent semantic/landmark tags.
 *
 * `.strict()` forbids any prop outside this surface. `className`/`style`/`id`/`ref` and the rest of
 * the non-`aria-*` `HTMLDivElement` spread are dropped (no A2UI representation).
 */
export const PopoverApi = {
  name: 'Popover',
  schema: z
    .object({
      children: CommonSchemas.ChildList,
      caret: z
        .enum([
          'top',
          'bottom',
          'left',
          'right',
          'bottom-left',
          'bottom-right',
          'top-left',
          'top-right',
          'left-bottom',
          'left-top',
          'right-bottom',
          'right-top',
        ])
        .optional(),
      open: CommonSchemas.DynamicBoolean.optional(),
      relative: z.boolean().optional(),
      as: z.enum(['div', 'section', 'aside']).optional(),
    })
    .strict(),
} as const;

export type PopoverProps = z.infer<typeof PopoverApi.schema>;
