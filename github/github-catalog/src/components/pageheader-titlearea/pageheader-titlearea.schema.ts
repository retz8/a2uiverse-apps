import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {responsive} from '../../shared/responsive';

/**
 * Runtime (zod) representation of Primer PageHeader.TitleArea, props-only. Part of the PageHeader
 * compound family (see pageheader.md for shared conventions). `.strict()` forbids any prop
 * outside this surface.
 */
export const PageHeaderTitleAreaApi = {
  name: 'PageHeader.TitleArea',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      variant: responsive(z.enum(['subtitle', 'medium', 'large'])).optional(),
      hidden: responsive(z.boolean()).optional(),
    })
    .strict(),
} as const;

export type PageHeaderTitleAreaProps = z.infer<typeof PageHeaderTitleAreaApi.schema>;
