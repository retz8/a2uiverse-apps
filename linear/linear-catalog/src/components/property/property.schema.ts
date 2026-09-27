import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/** A labelled property of an item: the label, and the value's parts — a glyph, a name, chips. */
export const PropertyApi = {
  name: 'Property',
  schema: z
    .object({
      label: CommonSchemas.DynamicString,
      children: CommonSchemas.ChildList,
    })
    .strict(),
} as const;
