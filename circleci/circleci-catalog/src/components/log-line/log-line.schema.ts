import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/** Runtime (zod) representation of `LogLine`, props-only. */
export const LogLineApi = {
  name: 'LogLine',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
    })
    .strict(),
} as const;
