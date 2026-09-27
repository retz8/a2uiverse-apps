import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/** Runtime (zod) representation of `LogBlock`, props-only. */
export const LogBlockApi = {
  name: 'LogBlock',
  schema: z
    .object({
      children: CommonSchemas.ChildList,
    })
    .strict(),
} as const;
