import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer TreeView.ErrorDialog, props-only. A dialog shown when a
 * tree item's contents fail to load, offering the option to retry or dismiss.
 *
 * `ErrorDialog` wraps Primer's self-contained `ConfirmationDialog` (`TreeView.js:1392`), which
 * portals to the document body and manages its own backdrop/focus; it renders through the normal
 * adapter->renderer path with no extra infrastructure. It reads Primer's item context, so it must
 * be composed inside an `Item`.
 *
 * - `children` (required) -> `ChildList`: the error message content shown in the dialog.
 * - `title` is the dialog heading -> plain string (default "Error", from `TreeView.js:1361`, in
 *   `catalog.json`).
 * - `retryAction` (<- `onRetry`) / `dismissAction` (<- `onDismiss`) -> `Action`; `retryAction`
 *   accepts the `event` shape, so `ErrorDialog` has an agent section.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const TreeViewErrorDialogApi = {
  name: 'TreeViewErrorDialog',
  schema: z
    .object({
      children: CommonSchemas.ChildList,
      title: z.string().optional(),
      retryAction: CommonSchemas.Action.optional(),
      dismissAction: CommonSchemas.Action.optional(),
    })
    .strict(),
} as const;

export type TreeViewErrorDialogProps = z.infer<typeof TreeViewErrorDialogApi.schema>;
