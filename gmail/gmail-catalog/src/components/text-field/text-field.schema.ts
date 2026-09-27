import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * A Material 3 text field: `outlined` or `filled` with a floating label, or `plain` — the label
 * set before the value on one underlined line, as in a message's header fields. Two-way bound:
 * typing writes the value back.
 */
export const TextFieldApi = {
  name: 'TextField',
  schema: z
    .object({
      label: CommonSchemas.DynamicString,
      value: CommonSchemas.DynamicString.optional(),
      placeholder: z.string().optional(),
      variant: z.enum(['outlined', 'filled', 'plain']).optional(),
      multiline: z.boolean().optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
    })
    .strict(),
} as const;
