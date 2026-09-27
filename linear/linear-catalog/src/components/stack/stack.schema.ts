import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/** A flex container: its children in a column or a row, spaced by one of the catalog's gaps. */
export const StackApi = {
  name: 'Stack',
  schema: z
    .object({
      children: CommonSchemas.ChildList,
      direction: z.enum(['vertical', 'horizontal']).optional(),
      gap: z.enum(['none', 'xs', 's', 'm', 'l', 'xl']).optional(),
      align: z.enum(['stretch', 'start', 'center', 'end', 'baseline']).optional(),
      justify: z.enum(['start', 'center', 'end', 'space-between']).optional(),
      wrap: z.boolean().optional(),
      padding: z.enum(['none', 's', 'm', 'l']).optional(),
    })
    .strict(),
} as const;

export type StackProps = z.infer<typeof StackApi.schema>;
