import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/** Runtime (zod) representation of `List`, props-only. */
export const ListApi = {
  name: 'List',
  schema: z
    .object({
      children: CommonSchemas.ChildList,
      connector: z.enum(['none', 'tree']).optional(),
    })
    .strict(),
} as const;
