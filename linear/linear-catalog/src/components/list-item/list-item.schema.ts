import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * One row of a `List` or a `ListGroup`: its leading visuals, its content taking the remaining
 * width on one line, and its trailing meta at the far end. With an action the whole row is the
 * button, so a row with an action holds no button of its own.
 */
export const ListItemApi = {
  name: 'ListItem',
  schema: z
    .object({
      child: CommonSchemas.ComponentId,
      leading: CommonSchemas.ChildList.optional(),
      trailing: CommonSchemas.ChildList.optional(),
      action: CommonSchemas.Action.optional(),
    })
    .strict(),
} as const;
