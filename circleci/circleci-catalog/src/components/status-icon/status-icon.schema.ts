import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/** Runtime (zod) representation of `StatusIcon`, props-only. */
export const StatusIconApi = {
  name: 'StatusIcon',
  schema: z
    .object({
      status: CommonSchemas.DynamicString,
      size: z.enum(['small', 'medium']).optional(),
    })
    .strict(),
} as const;
