import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/** Runtime (zod) representation of `Heading`, props-only. */
export const HeadingApi = {
  name: 'Heading',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      size: z.enum(['large', 'medium', 'small']).optional(),
    })
    .strict(),
} as const;
