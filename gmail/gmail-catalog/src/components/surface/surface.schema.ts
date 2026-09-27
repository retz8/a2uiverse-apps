import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * A Material 3 surface holding one child: a surface-container tier, a corner shape, padding and
 * an elevation. The tiers step from `lowest`, the brightest in light mode, to `highest`.
 */
export const SurfaceApi = {
  name: 'Surface',
  schema: z
    .object({
      child: CommonSchemas.ComponentId,
      container: z.enum(['lowest', 'low', 'default', 'high', 'highest']).optional(),
      shape: z.enum(['none', 'small', 'medium', 'large', 'extraLarge']).optional(),
      padding: z.enum(['none', 'small', 'medium', 'large']).optional(),
      elevation: z.enum(['level0', 'level1', 'level2', 'level3']).optional(),
    })
    .strict(),
} as const;

export type SurfaceProps = z.infer<typeof SurfaceApi.schema>;
