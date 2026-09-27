import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/** A person, as their initials in a circle; the full name is its label. */
export const AvatarApi = {
  name: 'Avatar',
  schema: z
    .object({
      name: CommonSchemas.DynamicString,
      size: z.enum(['small', 'medium']).optional(),
    })
    .strict(),
} as const;
