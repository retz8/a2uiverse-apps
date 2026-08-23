import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `Dialog.CloseButton`, props-only. A dismissal icon button
 * rendered inside a custom dialog header. Part of the `Dialog` compound family (6.52) — see
 * `dialog.md`.
 *
 * Composed inside `DialogHeader`. Primer renders a canned invisible X icon button with a hardcoded
 * accessible name (`"Close"`), so there is no `accessibility` prop.
 *
 * **It does not close the dialog by itself.** Primer's `Dialog.CloseButton` only invokes the
 * `onClose` it is handed; the root's own close path (`DialogView.handleClose`) is reachable only
 * from the built-in X / Escape / backdrop, not from a composed child. Dismissal is therefore the
 * authored action's job — bind the root's `open` to a data-model path and have the action write
 * `false` to it (the `setBoolean` function exists for this). An earlier description claimed this
 * component closed the dialog; it never did.
 *
 * - `closeAction` (← `onClose`, required, synthetic) → `Action`: performed when the button is
 *   clicked, and the button's entire behaviour.
 *
 * `onKeyDown` (focus-trap keyboard plumbing) and the declared but unrendered `children` are dropped
 * (code is authority). `.strict()` forbids any prop outside this surface.
 */
export const DialogCloseButtonApi = {
  name: 'DialogCloseButton',
  schema: z
    .object({
      closeAction: CommonSchemas.Action,
    })
    .strict(),
} as const;

export type DialogCloseButtonProps = z.infer<typeof DialogCloseButtonApi.schema>;
