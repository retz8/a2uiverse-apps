import {z} from 'zod';

/** Runtime (zod) representation of `Divider`, props-only. */
export const DividerApi = {
  name: 'Divider',
  schema: z
    .object({
      orientation: z.enum(['horizontal', 'vertical']).optional(),
    })
    .strict(),
} as const;
