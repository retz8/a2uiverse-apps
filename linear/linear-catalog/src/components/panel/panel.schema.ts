import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/** A view's surface: a bordered, rounded panel one step above the page, holding one child. */
export const PanelApi = {
  name: 'Panel',
  schema: z
    .object({
      child: CommonSchemas.ComponentId,
      padding: z.enum(['none', 'normal']).optional(),
    })
    .strict(),
} as const;

export type PanelProps = z.infer<typeof PanelApi.schema>;
