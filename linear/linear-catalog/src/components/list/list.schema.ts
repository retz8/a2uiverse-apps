import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/** A dense list: `ListItem` rows, or `ListGroup`s of them, with hairlines between the rows. */
export const ListApi = {
  name: 'List',
  schema: z
    .object({
      children: CommonSchemas.ChildList,
    })
    .strict(),
} as const;
