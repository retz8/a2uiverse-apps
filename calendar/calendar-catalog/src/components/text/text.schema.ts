import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

export const TYPE_ROLES = [
  'displaySmall',
  'headlineLarge',
  'headlineMedium',
  'headlineSmall',
  'titleLarge',
  'titleMedium',
  'titleSmall',
  'bodyLarge',
  'bodyMedium',
  'bodySmall',
  'labelLarge',
  'labelMedium',
  'labelSmall',
] as const;

export const TEXT_COLORS = [
  'onSurface',
  'onSurfaceVariant',
  'primary',
  'error',
  'inherit',
] as const;

/**
 * A run of text in one of Material 3's type roles, from `displaySmall` down to `labelSmall`, with
 * an optional weight, a colour role, and a clamp to a number of lines.
 */
export const TextApi = {
  name: 'Text',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      variant: z.enum(TYPE_ROLES).optional(),
      weight: z.enum(['regular', 'medium', 'bold']).optional(),
      color: z.enum(TEXT_COLORS).optional(),
      maxLines: z.number().int().min(1).optional(),
    })
    .strict(),
} as const;

export type TextProps = z.infer<typeof TextApi.schema>;
export type TypeRole = (typeof TYPE_ROLES)[number];
