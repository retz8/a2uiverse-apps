import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/** A Material 3 checkbox with an optional label. Two-way bound: checking writes the value back. */
export const CheckboxApi = {
  name: 'Checkbox',
  schema: z
    .object({
      value: CommonSchemas.DynamicBoolean,
      label: CommonSchemas.DynamicString.optional(),
      action: CommonSchemas.Action.optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
    })
    .strict(),
} as const;
