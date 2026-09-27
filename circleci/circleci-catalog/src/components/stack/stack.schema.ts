import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/** Runtime (zod) representation of `Stack`, props-only; `catalog.json` carries the same surface. */
export const StackApi = {
  name: 'Stack',
  schema: z
    .object({
      children: CommonSchemas.ChildList.optional(),
      direction: z.enum(['vertical', 'horizontal']).optional(),
      gap: z.enum(['none', 'xsmall', 'small', 'medium', 'large']).optional(),
      align: z.enum(['start', 'center', 'end', 'stretch', 'baseline']).optional(),
      justify: z.enum(['start', 'center', 'end', 'spaceBetween']).optional(),
      wrap: z.boolean().optional(),
    })
    .strict(),
} as const;

export type StackProps = z.infer<typeof StackApi.schema>;
