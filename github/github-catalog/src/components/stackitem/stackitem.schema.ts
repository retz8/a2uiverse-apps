import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {responsive} from '../../shared/responsive';

/**
 * Runtime (zod) representation of Primer Stack.Item, props-only. The per-child sizing wrapper for
 * Stack (component name `StackItem`).
 *
 * - `children` is the synthetic `ChildList` content channel — optional, faithful to Primer.
 * - `grow`/`shrink` carry their full `ResponsiveValue` union via `responsive()` with a plain
 *   `z.boolean()` scalar arm: Primer does not data-bind these, so no `DynamicBoolean`.
 * - `as` is the polymorphic item element — Stack's container set plus `li` (a stack item is the
 *   natural list element). Defaults (`grow: false`, `shrink: true`) live in `catalog.json`.
 * - `.strict()` forbids any prop outside this surface.
 */
export const StackItemApi = {
  name: 'StackItem',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      grow: responsive(z.boolean()).optional(),
      shrink: responsive(z.boolean()).optional(),
      as: z
        .enum([
          'div',
          'span',
          'section',
          'nav',
          'article',
          'aside',
          'header',
          'footer',
          'main',
          'ul',
          'ol',
          'li',
        ])
        .optional(),
    })
    .strict(),
} as const;

export type StackItemProps = z.infer<typeof StackItemApi.schema>;
