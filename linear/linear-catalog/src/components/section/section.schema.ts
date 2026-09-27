import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/** A titled block of a view — links, activity — with an optional count beside its title. */
export const SectionApi = {
  name: 'Section',
  schema: z
    .object({
      title: CommonSchemas.DynamicString,
      count: CommonSchemas.DynamicString.optional(),
      children: CommonSchemas.ChildList,
    })
    .strict(),
} as const;
