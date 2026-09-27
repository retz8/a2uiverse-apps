import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/** Runtime (zod) representation of `Panel`, props-only. */
export const PanelApi = {
  name: 'Panel',
  schema: z
    .object({
      child: CommonSchemas.ComponentId,
      padding: z.enum(['none', 'small', 'medium', 'large']).optional(),
      tone: z.enum(['default', 'muted', 'danger']).optional(),
    })
    .strict(),
} as const;
