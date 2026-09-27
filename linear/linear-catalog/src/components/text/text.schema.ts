import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * A run of plain text in one of the type registers. `title` is a view's one title, `heading` a
 * section's; `body` is the default; `secondary` is quieter body text, for identifiers; `caption`
 * is the smallest, for times and field labels.
 */
export const TextApi = {
  name: 'Text',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      variant: z.enum(['title', 'heading', 'body', 'secondary', 'caption']).optional(),
      weight: z.enum(['normal', 'medium', 'semibold']).optional(),
      truncate: z.boolean().optional(),
    })
    .strict(),
} as const;

export type TextProps = z.infer<typeof TextApi.schema>;
export type TextVariant = NonNullable<TextProps['variant']>;
