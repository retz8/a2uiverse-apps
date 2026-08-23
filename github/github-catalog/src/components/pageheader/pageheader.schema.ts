import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer PageHeader, props-only. Part of the PageHeader
 * compound family (see pageheader.md for shared conventions). `.strict()` forbids any prop
 * outside this surface.
 */
export const PageHeaderApi = {
  name: 'PageHeader',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      as: z.enum(['header', 'div']).optional(),
      role: z.string().optional(),
      hasBorder: z.boolean().optional(),
      'aria-label': CommonSchemas.DynamicString.optional(),
    })
    .strict(),
} as const;

export type PageHeaderProps = z.infer<typeof PageHeaderApi.schema>;
