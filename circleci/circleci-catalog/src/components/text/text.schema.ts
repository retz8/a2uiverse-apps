import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/** Runtime (zod) representation of `Text`, props-only. */
export const TextApi = {
  name: 'Text',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      size: z.enum(['medium', 'small']).optional(),
      tone: z.enum(['default', 'muted', 'danger']).optional(),
      weight: z.enum(['normal', 'medium', 'semibold']).optional(),
      font: z.enum(['sans', 'mono']).optional(),
      truncate: z.boolean().optional(),
    })
    .strict(),
} as const;

export type TextProps = z.infer<typeof TextApi.schema>;
