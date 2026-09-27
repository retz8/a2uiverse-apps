import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * A group of rows inside a `List`, headed by its label — a state's name — with an optional
 * leading visual and a count.
 */
export const ListGroupApi = {
  name: 'ListGroup',
  schema: z
    .object({
      label: CommonSchemas.DynamicString,
      count: CommonSchemas.DynamicString.optional(),
      leading: CommonSchemas.ComponentId.optional(),
      children: CommonSchemas.ChildList,
    })
    .strict(),
} as const;
