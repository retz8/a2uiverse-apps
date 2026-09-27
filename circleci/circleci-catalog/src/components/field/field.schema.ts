import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/** Runtime (zod) representation of `Field`, props-only. */
export const FieldApi = {
  name: 'Field',
  schema: z
    .object({
      label: CommonSchemas.DynamicString,
      child: CommonSchemas.ComponentId,
    })
    .strict(),
} as const;
