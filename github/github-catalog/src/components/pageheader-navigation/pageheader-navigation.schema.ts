import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {responsive} from '../../shared/responsive';

/**
 * Runtime (zod) representation of Primer PageHeader.Navigation, props-only. Part of the PageHeader
 * compound family (see pageheader.md for shared conventions). `.strict()` forbids any prop
 * outside this surface.
 */
export const PageHeaderNavigationApi = {
  name: 'PageHeader.Navigation',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      as: z.enum(['nav', 'div']).optional(),
      'aria-label': CommonSchemas.DynamicString.optional(),
      'aria-labelledby': CommonSchemas.DynamicString.optional(),
      hidden: responsive(z.boolean()).optional(),
    })
    .strict(),
} as const;

export type PageHeaderNavigationProps = z.infer<typeof PageHeaderNavigationApi.schema>;
