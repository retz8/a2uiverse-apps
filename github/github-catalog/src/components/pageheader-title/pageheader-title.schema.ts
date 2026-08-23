import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {responsive} from '../../shared/responsive';

/**
 * Runtime (zod) representation of Primer PageHeader.Title, props-only. Part of the PageHeader
 * compound family (see pageheader.md for shared conventions). `.strict()` forbids any prop
 * outside this surface.
 */
export const PageHeaderTitleApi = {
  name: 'PageHeader.Title',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      as: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']).optional(),
      hidden: responsive(z.boolean()).optional(),
    })
    .strict(),
} as const;

export type PageHeaderTitleProps = z.infer<typeof PageHeaderTitleApi.schema>;
