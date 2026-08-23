import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {responsive} from '../../shared/responsive';

/**
 * Runtime (zod) representation of Primer PageHeader.ContextAreaActions, props-only. Part of the PageHeader
 * compound family (see pageheader.md for shared conventions). `.strict()` forbids any prop
 * outside this surface.
 */
export const PageHeaderContextAreaActionsApi = {
  name: 'PageHeader.ContextAreaActions',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      hidden: responsive(z.boolean()).optional(),
    })
    .strict(),
} as const;

export type PageHeaderContextAreaActionsProps = z.infer<
  typeof PageHeaderContextAreaActionsApi.schema
>;
