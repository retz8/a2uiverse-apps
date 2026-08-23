import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {responsive} from '../../shared/responsive';

/**
 * Runtime (zod) representation of Primer PageHeader.ParentLink, props-only. Part of the PageHeader
 * compound family (see pageheader.md for shared conventions). `.strict()` forbids any prop
 * outside this surface.
 */
export const PageHeaderParentLinkApi = {
  name: 'PageHeader.ParentLink',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      href: CommonSchemas.DynamicString,
      'aria-label': CommonSchemas.DynamicString.optional(),
      hidden: responsive(z.boolean()).optional(),
    })
    .strict(),
} as const;

export type PageHeaderParentLinkProps = z.infer<typeof PageHeaderParentLinkApi.schema>;
