import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer Link, props-only.
 *
 * - `text` is the synthetic content prop (Primer Link takes content via React
 *   children, but A2UI children are component IDs, so content needs a value prop).
 * - `href` is the required navigation target.
 * - `muted`/`inline` are Primer's real Link-specific styling props, plain booleans.
 * - `target` is the `a` host-element attribute, tightened to the `_self`/`_blank` enum.
 * - `accessibility` maps `label`/`description` onto `aria-label`/`aria-description`.
 *   The polymorphic `as`, the deprecated `hoverColor`/`underline`, and the rest of the
 *   `a` host-element spread are dropped (see _dev/docs/new-components/link.md).
 * - `.strict()` forbids any prop outside this surface.
 */
export const LinkApi = {
  name: 'Link',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      href: CommonSchemas.DynamicString,
      muted: z.boolean().optional(),
      inline: z.boolean().optional(),
      target: z.enum(['_self', '_blank']).optional(),
      accessibility: CommonSchemas.AccessibilityAttributes.optional(),
    })
    .strict(),
} as const;

export type LinkProps = z.infer<typeof LinkApi.schema>;
