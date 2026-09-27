import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/** A label's name in a small tinted tag, set beside what it labels. Not interactive. */
export const TagApi = {
  name: 'Tag',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      tone: z.enum(['neutral', 'primary', 'error']).optional(),
    })
    .strict(),
} as const;
