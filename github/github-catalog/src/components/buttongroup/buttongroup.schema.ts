import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer ButtonGroup, props-only. A pure presentational
 * container that joins related buttons into a single visually-connected row.
 *
 * - `children` is the synthetic content channel, typed `CommonSchemas.ChildList` (a static array
 *   of component ids, or a `{componentId, path}` dynamic template) — optional, faithful to
 *   Primer's optional `children` (an empty group is legal).
 * - `role` is carried as a curated `z.enum` over its two meaningful values: `toolbar` presents
 *   the buttons as a toolbar with arrow-key roving focus; `group` marks them as a set of related
 *   controls. Every other string the raw `role?: string` admits is a meaningless role here.
 * - `as` is Primer's polymorphic container element narrowed to the two display-equivalent generic
 *   containers; ButtonGroup is not list-semantic, so the list tags are excluded. The default
 *   (`div`, from the installed code) lives in `catalog.json`, never as a zod `.default()`.
 * - `.strict()` forbids any prop outside this surface.
 */
export const ButtonGroupApi = {
  name: 'ButtonGroup',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      role: z.enum(['group', 'toolbar']).optional(),
      as: z.enum(['div', 'span']).optional(),
    })
    .strict(),
} as const;

export type ButtonGroupProps = z.infer<typeof ButtonGroupApi.schema>;
