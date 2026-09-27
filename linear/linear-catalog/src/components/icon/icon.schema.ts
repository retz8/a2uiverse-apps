import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

export const ICON_NAMES = [
  'arrow-right',
  'branch',
  'pull-request',
  'link',
  'plus',
  'check',
] as const;

/**
 * A small system glyph: an arrow for a change from one value to another, a branch, a pull
 * request, a link, a plus, a check. Decorative unless it carries a label.
 */
export const IconApi = {
  name: 'Icon',
  schema: z
    .object({
      name: z.enum(ICON_NAMES),
      label: CommonSchemas.DynamicString.optional(),
    })
    .strict(),
} as const;

export type IconName = (typeof ICON_NAMES)[number];
