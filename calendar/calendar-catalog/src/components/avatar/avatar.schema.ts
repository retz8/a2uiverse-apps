import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * A person's initial in a filled circle, with an optional badge for their response to an
 * invitation: accepted, declined, or awaiting.
 */
export const AvatarApi = {
  name: 'Avatar',
  schema: z
    .object({
      name: CommonSchemas.DynamicString,
      status: CommonSchemas.DynamicString.optional(),
      size: z.enum(['small', 'medium', 'large']).optional(),
    })
    .strict(),
} as const;
