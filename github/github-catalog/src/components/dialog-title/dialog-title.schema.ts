import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `Dialog.Title`, props-only. The dialog's heading text,
 * rendered inside a custom dialog header. Part of the `Dialog` compound family (6.52) — see
 * `dialog.md`.
 *
 * Composed inside `DialogHeader`. Mirrors `PageHeader.Title`: the raw text content is carried by a
 * synthetic `text` prop (synthetic-content-prop rule: raw text content → synthetic value prop typed
 * `DynamicString`); the fixed `<h1>` element means no `as`.
 *
 * - `text` (required, synthetic) → `DynamicString`: the dialog's heading text.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const DialogTitleApi = {
  name: 'DialogTitle',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
    })
    .strict(),
} as const;

export type DialogTitleProps = z.infer<typeof DialogTitleApi.schema>;
