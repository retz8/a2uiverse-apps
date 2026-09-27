import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of `StatusBadge`, props-only. `status` is bound runtime state: a
 * list template binds it per row, and the word picks the pill's tone.
 */
export const StatusBadgeApi = {
  name: 'StatusBadge',
  schema: z
    .object({
      status: CommonSchemas.DynamicString,
    })
    .strict(),
} as const;
