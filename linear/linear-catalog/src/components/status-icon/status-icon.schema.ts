import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * A workflow state's glyph. `type` — the state's type as the data carries it: backlog, unstarted,
 * started, completed, canceled, duplicate, triage — decides the drawing; `status`, the team's own
 * name for the state, is its label. Bind both per row in a list.
 */
export const StatusIconApi = {
  name: 'StatusIcon',
  schema: z
    .object({
      status: CommonSchemas.DynamicString,
      type: CommonSchemas.DynamicString,
    })
    .strict(),
} as const;
