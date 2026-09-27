import {z} from 'zod';

/** A hairline between sections: full width, inset at the start, or inset on both sides. */
export const DividerApi = {
  name: 'Divider',
  schema: z
    .object({
      inset: z.enum(['none', 'start', 'middle']).optional(),
    })
    .strict(),
} as const;
