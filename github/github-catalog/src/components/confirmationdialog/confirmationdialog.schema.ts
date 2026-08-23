import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `ConfirmationDialog`, props-only. A modal confirmation
 * prompt with exactly two buttons — one to cancel and one to confirm an action.
 *
 * A rigid wrapper over `Dialog` (6.52): it hard-codes `role = 'alertdialog'` and synthesizes exactly
 * two footer buttons (cancel + confirm) wired to the single `onClose(gesture)` callback. Rendering is
 * self-contained — the same portalled overlay path as the Dialog family, no new infrastructure.
 *
 * The `onClose` split — a single real `onClose(gesture)` callback where
 * `gesture ∈ {'confirm','cancel','close-button','escape'}` — is materialized at authoring time into
 * two synthetic required Actions:
 * - `confirmAction` ← `onClose('confirm')` — the confirm button.
 * - `cancelAction` ← `onClose('cancel' | 'close-button' | 'escape')` — the cancel button, the header
 *   close button, the Escape key, and the backdrop.
 *
 * - `title` is REQUIRED — usually a brief question, and the dialog's accessible name.
 * - `confirmButtonType` is a plain enum; `danger` marks a destructive action (default `"normal"`).
 * - `overrideButtonFocus` has no static default — the applied focus is computed (confirm button, or
 *   cancel button when `confirmButtonType === 'danger'`); optional.
 * - `width` carries the same `DialogWidth` union as the Dialog family, but ConfirmationDialog's code
 *   default is `'medium'` (surfaced only in `catalog.json`).
 * - `children` is the body message content only — no header/body/footer slot scanning.
 *
 * `.strict()` forbids any prop outside this surface. `className` is dropped (styling passthrough).
 */
export const ConfirmationDialogApi = {
  name: 'ConfirmationDialog',
  schema: z
    .object({
      confirmAction: CommonSchemas.Action,
      cancelAction: CommonSchemas.Action,
      title: CommonSchemas.DynamicString,
      cancelButtonContent: CommonSchemas.DynamicString.optional(),
      confirmButtonContent: CommonSchemas.DynamicString.optional(),
      confirmButtonType: z.enum(['normal', 'primary', 'danger']).optional(),
      cancelButtonLoading: CommonSchemas.DynamicBoolean.optional(),
      confirmButtonLoading: CommonSchemas.DynamicBoolean.optional(),
      overrideButtonFocus: z.enum(['cancel', 'confirm']).optional(),
      width: z
        .union([z.enum(['small', 'medium', 'large', 'xlarge']), z.string(), z.number()])
        .optional(),
      height: z.enum(['small', 'large', 'auto']).optional(),
      children: CommonSchemas.ChildList.optional(),
    })
    .strict(),
} as const;

export type ConfirmationDialogProps = z.infer<typeof ConfirmationDialogApi.schema>;
