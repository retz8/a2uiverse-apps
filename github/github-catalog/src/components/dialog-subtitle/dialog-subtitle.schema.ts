import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer `Dialog.Subtitle`, props-only. Secondary text rendered
 * below the dialog's title inside a custom dialog header. Part of the `Dialog` compound family
 * (6.52) — see `dialog.md`.
 *
 * Composed inside `DialogHeader`. Mirrors `PageHeader.Title`: the raw text content is carried by a
 * synthetic `text` prop (synthetic-content-prop rule: raw text content → synthetic value prop typed
 * `DynamicString`); the fixed `<h2>` element means no `as`.
 *
 * - `text` (required, synthetic) → `DynamicString`: secondary text shown below the dialog's title.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const DialogSubtitleApi = {
  name: 'DialogSubtitle',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
    })
    .strict(),
} as const;

export type DialogSubtitleProps = z.infer<typeof DialogSubtitleApi.schema>;
