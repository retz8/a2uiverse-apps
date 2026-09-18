import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of `StatusIcon`, props-only. Mirrors the component's entry in
 * `catalogs/v0.9.1/catalog.json` — the parity test keeps the two in lockstep.
 *
 * Both props are bound runtime state: a list template binds them per row, which is the whole
 * reason the component exists — the basic catalog has no property that varies a row's look by
 * data. `type` decides the drawing; `status` is the team's own name for it, the icon's label.
 */
export const StatusIconApi = {
  name: 'StatusIcon',
  schema: z
    .object({
      status: CommonSchemas.DynamicString,
      type: CommonSchemas.DynamicString,
      weight: z.number().optional(),
    })
    .strict(),
} as const;

export type StatusIconProps = z.infer<typeof StatusIconApi.schema>;
