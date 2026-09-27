import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {ICON_NAME} from '../icon/icon.schema.js';

/**
 * A Material 3 common button: a label and an optional leading icon, carrying an action. `filled`
 * is the one high-emphasis action; `tonal` a medium one; `outlined` and `text` the rest.
 */
export const ButtonApi = {
  name: 'Button',
  schema: z
    .object({
      label: CommonSchemas.DynamicString,
      action: CommonSchemas.Action,
      variant: z.enum(['filled', 'tonal', 'outlined', 'text', 'elevated']).optional(),
      icon: ICON_NAME.optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
    })
    .strict(),
} as const;

export type ButtonProps = z.infer<typeof ButtonApi.schema>;
