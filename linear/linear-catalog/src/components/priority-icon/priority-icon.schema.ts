import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * A priority's glyph: bars rising with the priority, a mark for urgent, dashes for none.
 * `priority` is the priority's name as the data carries it — Urgent, High, Medium, Low, No
 * priority — or its number, 0 to 4; it is also the glyph's label. Bind it per row in a list.
 */
export const PriorityIconApi = {
  name: 'PriorityIcon',
  schema: z
    .object({
      priority: CommonSchemas.DynamicString,
    })
    .strict(),
} as const;
