import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `Popover.Content`, props-only. The visible content box of
 * a popover, holding its heading, message text, and action controls. Part of the `Popover` compound
 * family (6.56) — see `popover.md`.
 *
 * Composed as the child of `Popover`.
 *
 * - `children` is tightened to REQUIRED: the box's only content channel (heading / message text /
 *   action controls).
 * - `width`/`height`/`overflow` are the box's box-model enums (code defaults `"small"` /
 *   `"fit-content"` / `"auto"`, surfaced only in `catalog.json`).
 * - `onClickOutside` (← the callback) → optional `Action`: the popover's only dismissal signal
 *   (there is no built-in Escape / backdrop), the hook that lets an outside-click drive a local
 *   `functionCall` or an agent `event`. It does not forward the callback's DOM event argument
 *   (`Action` context is authored, not per-invocation).
 * - `accessibility` carries the accessible name/description for the content region — the region
 *   assistive tech lands in (the root is a bare positioning wrapper and carries none).
 *
 * `.strict()` forbids any prop outside this surface. `as` is not exposed: Primer's `Popover.Content`
 * is not polymorphic (it renders a hardcoded `<div>`), so a semantic-tag prop would be inert — the
 * landmark identity lives on the root `Popover`'s `as` instead. `ignoreClickRefs` (live DOM refs,
 * not serializable) and `className`/`style` and the rest of the non-`aria-*` `HTMLDivElement` spread
 * are dropped.
 */
export const PopoverContentApi = {
  name: 'PopoverContent',
  schema: z
    .object({
      children: CommonSchemas.ChildList,
      width: z.enum(['xsmall', 'small', 'medium', 'large', 'xlarge', 'auto']).optional(),
      height: z.enum(['small', 'medium', 'large', 'xlarge', 'auto', 'fit-content']).optional(),
      overflow: z.enum(['auto', 'hidden', 'scroll', 'visible']).optional(),
      onClickOutside: CommonSchemas.Action.optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type PopoverContentProps = z.infer<typeof PopoverContentApi.schema>;
