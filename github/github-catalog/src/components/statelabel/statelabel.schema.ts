import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer StateLabel, props-only.
 *
 * - `text` is the synthetic content prop (Primer StateLabel takes content via React
 *   children, but A2UI children are component IDs, so content needs a value prop).
 * - `status` is Primer's real status enum (`keyof typeof octiconMap`), lifted verbatim —
 *   it selects the badge's icon and color treatment.
 * - `size` is Primer's real size enum (default `medium`, surfaced in catalog.json).
 * - Primer's deprecated `variant` alias is dropped (see the decision doc); `size` carries
 *   the same sizing axis.
 * - `.strict()` forbids any prop outside this surface.
 */
export const STATELABEL_STATUSES = [
  'issueOpened',
  'issueClosed',
  'issueClosedNotPlanned',
  'pullOpened',
  'pullClosed',
  'pullMerged',
  'draft',
  'issueDraft',
  'pullQueued',
  'unavailable',
  'alertOpened',
  'alertFixed',
  'alertDismissed',
  'alertClosed',
  'open',
  'closed',
  'archived',
] as const;

export const StateLabelApi = {
  name: 'StateLabel',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      status: z.enum(STATELABEL_STATUSES),
      size: z.enum(['small', 'medium']).optional(),
    })
    .strict(),
} as const;

export type StateLabelProps = z.infer<typeof StateLabelApi.schema>;
