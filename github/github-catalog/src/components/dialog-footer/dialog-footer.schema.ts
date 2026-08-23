import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `Dialog.Footer`, props-only. A custom footer region for a
 * dialog, replacing the default button footer. Part of the `Dialog` compound family (6.52) — see
 * `dialog.md`.
 *
 * Composed as a slot child of `Dialog` (routed by the root's slot scanner); hosts `DialogButtons` in
 * its `children`.
 *
 * - `children` (optional) → `ChildList`: the dialog's footer content.
 *
 * Primer's `Dialog.Footer` renders a fixed `<div>` (its polymorphic `as` is not handled by the
 * implementation — dropped); `.strict()` forbids any prop outside this surface.
 */
export const DialogFooterApi = {
  name: 'DialogFooter',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
    })
    .strict(),
} as const;

export type DialogFooterProps = z.infer<typeof DialogFooterApi.schema>;
