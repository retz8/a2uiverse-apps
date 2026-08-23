import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer RelativeTime, props-only.
 *
 * - `datetime` is the required content prop: the moment to display, an ISO 8601 string
 *   carried as a DynamicString so it can be literal or path-bound.
 * - `format`/`formatStyle`/`tense`/`precision`/`threshold`/`prefix` shape how the time is
 *   presented; `second`..`timeZoneName` are the eight `Intl.DateTimeFormat` part props for
 *   absolute-date rendering. All are lifted verbatim from the element's writable properties.
 * - The deprecated `format` aliases `micro`/`elapsed`, the `date`/`children` channels, and the
 *   element's read-only getters / host-element spread are dropped (see the decision doc).
 * - `.strict()` forbids any prop outside this surface. A `(default: X)` annotation surfaces
 *   only in catalog.json, never as a zod `.default()`.
 */
export const RelativeTimeApi = {
  name: 'RelativeTime',
  schema: z
    .object({
      datetime: CommonSchemas.DynamicString,
      format: z.enum(['auto', 'relative', 'duration', 'datetime']).optional(),
      formatStyle: z.enum(['long', 'short', 'narrow']).optional(),
      tense: z.enum(['auto', 'past', 'future']).optional(),
      precision: z
        .enum(['year', 'month', 'week', 'day', 'hour', 'minute', 'second', 'millisecond'])
        .optional(),
      threshold: z.string().optional(),
      prefix: z.string().optional(),
      second: z.enum(['numeric', '2-digit']).optional(),
      minute: z.enum(['numeric', '2-digit']).optional(),
      hour: z.enum(['numeric', '2-digit']).optional(),
      weekday: z.enum(['short', 'long', 'narrow']).optional(),
      day: z.enum(['numeric', '2-digit']).optional(),
      month: z.enum(['numeric', '2-digit', 'short', 'long', 'narrow']).optional(),
      year: z.enum(['numeric', '2-digit']).optional(),
      timeZoneName: z
        .enum(['long', 'short', 'shortOffset', 'longOffset', 'shortGeneric', 'longGeneric'])
        .optional(),
      noTitle: z.boolean().optional(),
    })
    .strict(),
} as const;

export type RelativeTimeProps = z.infer<typeof RelativeTimeApi.schema>;
