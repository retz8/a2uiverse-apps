import {z} from 'zod';

/** A hairline between sections. */
export const DividerApi = {
  name: 'Divider',
  schema: z.object({}).strict(),
} as const;
