import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {responsive} from '../../shared/responsive';

/**
 * One element of a dialog's button row — the shared local element type for the `Dialog` family.
 * Defined once here; consumed by the root's `footerButtons` and by `DialogButtons.buttons`
 * (`dialog-buttons.md`).
 *
 * The generic binder resolves each element's `Dynamic*`/`Action` fields in place: the array wraps a
 * plain `z.object`, which the binder's schema scraper recurses (the `actionbar-menu`/
 * `navlist-groupexpand` precedent), so at render time `content` is a string, `action` a ready-to-call
 * closure, and `disabled`/`loading` booleans.
 *
 * - `content` (← the button's label) → `DynamicString` (required).
 * - `buttonType` → the visual emphasis; `normal` is a legacy alias the implementation maps to
 *   `default` (default `"default"`, surfaced only in `catalog.json`).
 * - `action` (← `onClick`) → `Action` (required).
 * - `autoFocus` → whether this button is focused when the dialog opens; only the first entry marked
 *   applies (fixed configuration → plain `z.boolean()`, default `false`).
 * - `disabled` / `loading` → bound runtime state → `DynamicBoolean`.
 *
 * Dropped from each entry: `ref` (DOM ref, not serializable) and the rest of the inherited button
 * surface (`variant`, `size`, visuals, …) — the full surface lives on the shipped `Button` leaf.
 */
export const dialogButtonSchema = z
  .object({
    content: CommonSchemas.DynamicString,
    buttonType: z.enum(['default', 'primary', 'danger', 'normal']).optional(),
    action: CommonSchemas.Action,
    autoFocus: z.boolean().optional(),
    disabled: CommonSchemas.DynamicBoolean.optional(),
    loading: CommonSchemas.DynamicBoolean.optional(),
  })
  .strict();

/**
 * Runtime (zod) representation of Primer `Dialog` (the root), props-only. A modal window overlaid on
 * the page for focused tasks such as confirming an action, asking for disambiguation, or presenting
 * a small form; it traps focus and blocks interaction with the page beneath until closed.
 *
 * Self-contained overlay — no new infra: Primer's `Dialog` portals to the document body and manages
 * its own backdrop, focus trap, Escape handling, and body-scroll lock, rendering through the normal
 * adapter→renderer path (the `TreeView.ErrorDialog`/`ConfirmationDialog` precedent).
 *
 * - `title` is tightened to REQUIRED against the installed optional type: the code fallback
 *   `'Dialog'` is an accessible-name fallback, unreachable once the prop is required. It is also the
 *   dialog's accessible name.
 * - `children` are slot-scanned by the renderer: `DialogHeader`/`DialogBody`/`DialogFooter` children
 *   replace the default sections; every remaining child renders as the default body content.
 * - `open` is the controlled visibility state -> DynamicBoolean (optional; the component defaults to
 *   open when it is absent). Two-way bound like Details: the binder auto-generates `setOpen`, and a
 *   dismissal (X / Escape / backdrop) writes `false` back to the bound path, so the agent sees the
 *   close and can reopen by setting the path `true`. Absent (unbound) it is pure local state — the
 *   dialog still closes on dismissal, the agent just is not told.
 * - `closeAction` (← `onClose`) is the optional custom hook fired on dismissal (a `functionCall` or
 *   agent `event`), alongside the built-in close; it does not forward the library callback's gesture
 *   parameter (`Action` context is authored, not per-invocation).
 * - `footerButtons` uses the shared `dialogButton` element type (default `[]`).
 * - `role`/`height`/`align` are plain enums; `width` and `position` carry their real unions (`width`
 *   presets or any CSS value; `position` a scalar side/center or the `responsive()` object arm whose
 *   `bottom`/`fullscreen` values take effect only below the narrow breakpoint).
 *
 * `.strict()` forbids any prop outside this surface. `renderHeader`/`renderBody`/`renderFooter`
 * (function render props) are deferred — their capability is carried by the slot leaves;
 * `returnFocusRef`/`initialFocusRef` (DOM refs) and `className`/`style`/`data-component` are dropped.
 */
export const DialogApi = {
  name: 'Dialog',
  schema: z
    .object({
      title: CommonSchemas.DynamicString,
      subtitle: CommonSchemas.DynamicString.optional(),
      children: CommonSchemas.ChildList.optional(),
      open: CommonSchemas.DynamicBoolean.optional(),
      closeAction: CommonSchemas.Action.optional(),
      footerButtons: z.array(dialogButtonSchema).optional(),
      role: z.enum(['dialog', 'alertdialog']).optional(),
      width: z
        .union([z.enum(['small', 'medium', 'large', 'xlarge']), z.string(), z.number()])
        .optional(),
      height: z.enum(['small', 'large', 'auto']).optional(),
      position: z
        .union([
          z.enum(['center', 'left', 'right']),
          responsive(z.enum(['left', 'right', 'bottom', 'fullscreen', 'center'])),
        ])
        .optional(),
      align: z.enum(['top', 'center', 'bottom']).optional(),
    })
    .strict(),
} as const;

export type DialogProps = z.infer<typeof DialogApi.schema>;
