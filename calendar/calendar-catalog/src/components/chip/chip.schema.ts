import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {ICON_NAME} from '../icon/icon.schema.js';

/**
 * A Material 3 chip: `assist` and `suggestion` act, `filter` and `input` are selectable. With
 * `selected` bound, pressing writes the new state back, then performs the action.
 */
export const ChipApi = {
  name: 'Chip',
  schema: z
    .object({
      label: CommonSchemas.DynamicString,
      variant: z.enum(['assist', 'filter', 'input', 'suggestion']).optional(),
      icon: ICON_NAME.optional(),
      selected: CommonSchemas.DynamicBoolean.optional(),
      action: CommonSchemas.Action.optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
    })
    .strict(),
} as const;

export type ChipProps = z.infer<typeof ChipApi.schema>;
