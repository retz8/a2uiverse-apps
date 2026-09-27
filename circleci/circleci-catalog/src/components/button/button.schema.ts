import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of `Button`, props-only. `disabled` is bound runtime state
 * (DynamicBoolean); `variant` and `size` are fixed configuration.
 */
export const ButtonApi = {
  name: 'Button',
  schema: z
    .object({
      label: CommonSchemas.DynamicString,
      action: CommonSchemas.Action,
      variant: z.enum(['primary', 'secondary', 'ghost']).optional(),
      size: z.enum(['small', 'medium']).optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
    })
    .strict(),
} as const;
