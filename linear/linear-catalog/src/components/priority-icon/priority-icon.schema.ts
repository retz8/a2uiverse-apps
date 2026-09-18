import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of `PriorityIcon`, props-only. Mirrors the component's entry in
 * `catalogs/v0.9.1/catalog.json` — the parity test keeps the two in lockstep.
 *
 * `priority` is bound runtime state, per row in a list template: Linear's word for the
 * priority, which decides the drawing and is the icon's label.
 */
export const PriorityIconApi = {
  name: 'PriorityIcon',
  schema: z
    .object({
      priority: CommonSchemas.DynamicString,
      weight: z.number().optional(),
    })
    .strict(),
} as const;

export type PriorityIconProps = z.infer<typeof PriorityIconApi.schema>;
