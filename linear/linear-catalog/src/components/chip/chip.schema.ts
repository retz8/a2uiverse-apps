import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * A rounded chip: a label, and before it either a colour dot — the label's own colour from the
 * data, as `#rrggbb` — or a leading visual.
 */
export const ChipApi = {
  name: 'Chip',
  schema: z
    .object({
      label: CommonSchemas.DynamicString,
      color: CommonSchemas.DynamicString.optional(),
      leading: CommonSchemas.ComponentId.optional(),
    })
    .strict(),
} as const;
