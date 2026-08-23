import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer NavList.Description, props-only. Supplementary text shown
 * for a navigation item.
 *
 * - `text` is the required synthetic content channel (Primer takes content via raw `children`, but
 *   A2UI children are component ids, so content needs a value prop; `heading.md` rule).
 * - `variant` selects whether the text sits beside (`inline`) or below (`block`) the label;
 *   `truncate` truncates overflowing inline text. Defaults (`inline` / `false`) surface only in
 *   `catalog.json`, never as zod `.default()`.
 * - `.strict()` forbids any prop outside this surface (`className`, `style` are dropped).
 */
export const NavListDescriptionApi = {
  name: 'NavList.Description',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      variant: z.enum(['inline', 'block']).optional(),
      truncate: z.boolean().optional(),
    })
    .strict(),
} as const;

export type NavListDescriptionProps = z.infer<typeof NavListDescriptionApi.schema>;
