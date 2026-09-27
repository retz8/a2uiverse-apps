import {z} from 'zod';
import {ICON_NAMES, type IconName} from '../../icons.generated.js';

export const ICON_NAME = z.enum(ICON_NAMES as [IconName, ...IconName[]]);

/** A system glyph from the catalog's set: outlined or filled, in a size and a colour role. */
export const IconApi = {
  name: 'Icon',
  schema: z
    .object({
      name: ICON_NAME,
      filled: z.boolean().optional(),
      size: z.enum(['small', 'medium', 'large']).optional(),
      color: z.enum(['onSurface', 'onSurfaceVariant', 'primary', 'error', 'inherit']).optional(),
    })
    .strict(),
} as const;

export type IconProps = z.infer<typeof IconApi.schema>;
