import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `Dialog.Header`, props-only. A custom header region for a
 * dialog, replacing the default title/subtitle/close-button header. Part of the `Dialog` compound
 * family (6.52) — see `dialog.md`.
 *
 * Composed as a slot child of `Dialog` (routed by the root's slot scanner); hosts `DialogTitle`,
 * `DialogSubtitle`, and `DialogCloseButton` in its `children`.
 *
 * - `children` (optional) → `ChildList`: the dialog's header content.
 *
 * Primer's `Dialog.Header` renders a fixed `<div>` (its polymorphic `as` is not handled by the
 * implementation — dropped); `.strict()` forbids any prop outside this surface.
 */
export const DialogHeaderApi = {
  name: 'DialogHeader',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
    })
    .strict(),
} as const;

export type DialogHeaderProps = z.infer<typeof DialogHeaderApi.schema>;
