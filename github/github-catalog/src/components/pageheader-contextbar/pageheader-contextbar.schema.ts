import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {responsive} from '../../shared/responsive';

/**
 * Runtime (zod) representation of Primer PageHeader.ContextBar, props-only. Part of the PageHeader
 * compound family (see pageheader.md for shared conventions). `.strict()` forbids any prop
 * outside this surface.
 */
export const PageHeaderContextBarApi = {
  name: 'PageHeader.ContextBar',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      hidden: responsive(z.boolean()).optional(),
    })
    .strict(),
} as const;

export type PageHeaderContextBarProps = z.infer<typeof PageHeaderContextBarApi.schema>;
