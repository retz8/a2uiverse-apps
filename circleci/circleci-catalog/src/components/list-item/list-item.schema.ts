import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/** Runtime (zod) representation of `ListItem`, props-only. The action is optional. */
export const ListItemApi = {
  name: 'ListItem',
  schema: z
    .object({
      child: CommonSchemas.ComponentId,
      action: CommonSchemas.Action.optional(),
    })
    .strict(),
} as const;
