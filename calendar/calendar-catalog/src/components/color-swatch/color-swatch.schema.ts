import {z} from 'zod';
import {EVENT_COLORS} from './event-colors.js';

/** An event colour as a small rounded square beside a title, or a dot in a row. */
export const ColorSwatchApi = {
  name: 'ColorSwatch',
  schema: z
    .object({
      color: z.enum(EVENT_COLORS),
      shape: z.enum(['square', 'dot']).optional(),
    })
    .strict(),
} as const;
