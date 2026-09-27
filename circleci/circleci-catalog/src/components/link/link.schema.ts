import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/** Runtime (zod) representation of `Link`, props-only. */
export const LinkApi = {
  name: 'Link',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      action: CommonSchemas.Action,
      font: z.enum(['sans', 'mono']).optional(),
    })
    .strict(),
} as const;
