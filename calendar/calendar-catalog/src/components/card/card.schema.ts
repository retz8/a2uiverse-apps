import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/** A Material 3 card holding one child: elevated, filled or outlined, with the card's padding. */
export const CardApi = {
  name: 'Card',
  schema: z
    .object({
      child: CommonSchemas.ComponentId,
      variant: z.enum(['elevated', 'filled', 'outlined']).optional(),
    })
    .strict(),
} as const;

export type CardProps = z.infer<typeof CardApi.schema>;
