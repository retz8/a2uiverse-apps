import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {EVENT_COLORS} from '../color-swatch/event-colors.js';

/**
 * A Material 3 checkbox with an optional label, in the primary colour or a calendar's event colour.
 * Two-way bound: checking writes the value back.
 */
export const CheckboxApi = {
  name: 'Checkbox',
  schema: z
    .object({
      value: CommonSchemas.DynamicBoolean,
      label: CommonSchemas.DynamicString.optional(),
      color: z.enum(EVENT_COLORS).optional(),
      action: CommonSchemas.Action.optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
    })
    .strict(),
} as const;
