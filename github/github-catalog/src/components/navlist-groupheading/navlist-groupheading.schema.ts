import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer NavList.GroupHeading, props-only. A semantic heading for a
 * group of navigation items.
 *
 * - `text` is the required synthetic content channel (Primer takes content via raw `children`, but
 *   A2UI children are component ids, so content needs a value prop; `heading.md` rule).
 * - `variant` is the heading's visual style; `auxiliaryText` is secondary text; `visuallyHidden`
 *   keeps the heading available to assistive tech only; `as` selects the semantic level.
 * - `.strict()` forbids any prop outside this surface (`headingWrapElement`,
 *   `_internalBackwardCompatibleTitle`, `className`, `style` are dropped).
 */
export const NavListGroupHeadingApi = {
  name: 'NavList.GroupHeading',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      variant: z.enum(['subtle', 'filled']).optional(),
      auxiliaryText: CommonSchemas.DynamicString.optional(),
      visuallyHidden: z.boolean().optional(),
      as: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']).optional(),
    })
    .strict(),
} as const;

export type NavListGroupHeadingProps = z.infer<typeof NavListGroupHeadingApi.schema>;
