import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * One row of a `List`: leading visuals, a headline with its meta at the far end of the line,
 * supporting content, and trailing controls. In a wide list the headline, the supporting content
 * and the meta share one line; in a narrow one the supporting content wraps beneath. With an
 * action the whole row is pressable.
 */
export const ListItemApi = {
  name: 'ListItem',
  schema: z
    .object({
      headline: CommonSchemas.ComponentId,
      supporting: CommonSchemas.ComponentId.optional(),
      meta: CommonSchemas.ComponentId.optional(),
      leading: CommonSchemas.ChildList.optional(),
      trailing: CommonSchemas.ChildList.optional(),
      action: CommonSchemas.Action.optional(),
      selected: CommonSchemas.DynamicBoolean.optional(),
    })
    .strict(),
} as const;
