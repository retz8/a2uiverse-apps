import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `Dialog.Body`, props-only. A custom body region for a
 * dialog, replacing the default scrollable body. Part of the `Dialog` compound family (6.52) — see
 * `dialog.md`.
 *
 * Composed as a slot child of `Dialog` (routed by the root's slot scanner).
 *
 * - `children` (optional) → `ChildList`: the dialog's scrollable body content.
 *
 * Primer's `Dialog.Body` renders a fixed `<div>` (its polymorphic `as` is not handled by the
 * implementation — dropped); `.strict()` forbids any prop outside this surface.
 */
export const DialogBodyApi = {
  name: 'DialogBody',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
    })
    .strict(),
} as const;

export type DialogBodyProps = z.infer<typeof DialogBodyApi.schema>;
