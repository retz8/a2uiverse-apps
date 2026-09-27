import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/** Text written in Markdown — a description, a comment — rendered without HTML, links or images. */
export const MarkdownApi = {
  name: 'Markdown',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
    })
    .strict(),
} as const;
