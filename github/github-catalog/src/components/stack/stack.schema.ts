import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {responsive} from '../../shared/responsive';

/** Primer's shared six-step spacing scale, reused by gap and the three padding props. */
const spacingEnum = () => z.enum(['none', 'tight', 'condensed', 'cozy', 'normal', 'spacious']);

/**
 * Runtime (zod) representation of Primer Stack, props-only. The catalog's first container.
 *
 * - `children` is the synthetic content channel, typed `CommonSchemas.ChildList` (a static array
 *   of component ids, or a `{componentId, path}` dynamic template) — optional, faithful to
 *   Primer's optional `children`.
 * - Every scale prop carries its full `ResponsiveValue` union via `responsive()`: the scalar enum
 *   arm plus a `{narrow, regular, wide}` per-viewport map. Each enum is curated from that prop's
 *   own documented value set (the sets are not shared).
 * - `as` is Primer's polymorphic container element narrowed to display-equivalent flex containers.
 * - Defaults (direction/align/justify/padding/wrap, from the installed code) live in
 *   `catalog.json`, never as a zod `.default()`.
 * - `.strict()` forbids any prop outside this surface.
 */
export const StackApi = {
  name: 'Stack',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      direction: responsive(z.enum(['horizontal', 'vertical'])).optional(),
      gap: responsive(spacingEnum()).optional(),
      align: responsive(z.enum(['stretch', 'start', 'center', 'end', 'baseline'])).optional(),
      justify: responsive(
        z.enum(['start', 'center', 'end', 'space-between', 'space-evenly']),
      ).optional(),
      wrap: responsive(z.enum(['wrap', 'nowrap'])).optional(),
      padding: responsive(spacingEnum()).optional(),
      paddingBlock: responsive(spacingEnum()).optional(),
      paddingInline: responsive(spacingEnum()).optional(),
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
        ])
        .optional(),
    })
    .strict(),
} as const;

export type StackProps = z.infer<typeof StackApi.schema>;
