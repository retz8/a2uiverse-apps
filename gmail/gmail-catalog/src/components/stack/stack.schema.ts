import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/** Lays its children out in a column or a row: the gap between them, alignment, wrapping, padding. */
export const StackApi = {
  name: 'Stack',
  schema: z
    .object({
      children: CommonSchemas.ChildList,
      direction: z.enum(['vertical', 'horizontal']).optional(),
      gap: z.enum(['none', 'xs', 'sm', 'md', 'lg', 'xl']).optional(),
      align: z.enum(['stretch', 'start', 'center', 'end', 'baseline']).optional(),
      justify: z.enum(['start', 'center', 'end', 'spaceBetween']).optional(),
      wrap: z.boolean().optional(),
      padding: z.enum(['none', 'sm', 'md', 'lg']).optional(),
    })
    .strict(),
} as const;

export type StackProps = z.infer<typeof StackApi.schema>;
