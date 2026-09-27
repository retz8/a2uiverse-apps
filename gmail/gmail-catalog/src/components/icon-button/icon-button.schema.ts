import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {ICON_NAME} from '../icon/icon.schema.js';

/**
 * A Material 3 icon button: a glyph with an accessible label. With `selected` bound it is a
 * toggle — pressing writes the new state back, then performs the action.
 */
export const IconButtonApi = {
  name: 'IconButton',
  schema: z
    .object({
      icon: ICON_NAME,
      label: z.string(),
      variant: z.enum(['standard', 'filled', 'tonal', 'outlined']).optional(),
      selected: CommonSchemas.DynamicBoolean.optional(),
      action: CommonSchemas.Action.optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
    })
    .strict(),
} as const;

export type IconButtonProps = z.infer<typeof IconButtonApi.schema>;
