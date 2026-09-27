import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';
import {ICON_NAME} from '../icon/icon.schema.js';

/**
 * A navigation row: a glyph, a label and a trailing count, the active one on a filled pill. With
 * an action the row is pressable.
 */
export const NavigationItemApi = {
  name: 'NavigationItem',
  schema: z
    .object({
      label: CommonSchemas.DynamicString,
      icon: ICON_NAME.optional(),
      count: CommonSchemas.DynamicString.optional(),
      active: CommonSchemas.DynamicBoolean.optional(),
      action: CommonSchemas.Action.optional(),
    })
    .strict(),
} as const;
