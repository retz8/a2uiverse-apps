import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * A labelled button carrying an action. `primary` is the one action a view leads with, filled in
 * the accent; `secondary` is bordered; `ghost` is its label alone, for the way out.
 */
export const ButtonApi = {
  name: 'Button',
  schema: z
    .object({
      label: CommonSchemas.DynamicString,
      action: CommonSchemas.Action,
      variant: z.enum(['primary', 'secondary', 'ghost']).optional(),
      leading: CommonSchemas.ComponentId.optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
    })
    .strict(),
} as const;
