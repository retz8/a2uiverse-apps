import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * A view's header bar: an optional context, a `›`, then the title — a team and an issue's
 * identifier, or a view and its filter — with anything trailing at the far end.
 */
export const ViewHeaderApi = {
  name: 'ViewHeader',
  schema: z
    .object({
      title: CommonSchemas.DynamicString,
      context: CommonSchemas.DynamicString.optional(),
      trailing: CommonSchemas.ChildList.optional(),
    })
    .strict(),
} as const;
