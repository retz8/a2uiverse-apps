import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of `StatusBadge`, props-only. Mirrors the component's entry in
 * `catalogs/v0.9.1/catalog.json` — the parity test keeps the two in lockstep.
 *
 * `status` is bound runtime state: a list template binds it per row, which is the whole reason
 * the component exists — the basic catalog has no property that varies a row's look by data.
 */
export const StatusBadgeApi = {
  name: 'StatusBadge',
  schema: z
    .object({
      status: CommonSchemas.DynamicString,
      weight: z.number().optional(),
    })
    .strict(),
} as const;

export type StatusBadgeProps = z.infer<typeof StatusBadgeApi.schema>;
