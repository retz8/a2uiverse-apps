import {z} from 'zod';
import {dialogButtonSchema} from '../dialog/dialog.schema';

/**
 * Runtime (zod) representation of Primer `Dialog.Buttons`, props-only. A row of action buttons
 * rendered inside a dialog's footer. Part of the `Dialog` compound family (6.52) — see `dialog.md`
 * for the family note and the shared `dialogButton` local type this leaf consumes.
 *
 * Composed inside `DialogFooter`.
 *
 * - `buttons` (required) → `z.array(dialogButton)`: the buttons rendered as the dialog's footer
 *   actions. `dialogButton` is the shared element type defined in `dialog.md`
 *   (`content`/`buttonType`/`action`/`autoFocus`/`disabled`/`loading`).
 *
 * Primer's declared `children` (via `PropsWithChildren`) are never rendered by the implementation —
 * dropped (code is authority). `.strict()` forbids any prop outside this surface.
 */
export const DialogButtonsApi = {
  name: 'DialogButtons',
  schema: z
    .object({
      buttons: z.array(dialogButtonSchema),
    })
    .strict(),
} as const;

export type DialogButtonsProps = z.infer<typeof DialogButtonsApi.schema>;
