import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * A list of `ListItem` rows, optionally with a hairline between rows. `inline` rows put the
 * headline, the supporting content and the meta on one line when the list is wide, as a mailbox's
 * rows do; `stacked` rows always set the supporting content beneath the headline.
 */
export const ListApi = {
  name: 'List',
  schema: z
    .object({
      children: CommonSchemas.ChildList,
      dividers: z.boolean().optional(),
      layout: z.enum(['stacked', 'inline']).optional(),
    })
    .strict(),
} as const;
