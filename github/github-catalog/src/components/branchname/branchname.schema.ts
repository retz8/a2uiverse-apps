import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer BranchName, props-only.
 *
 * - `text` is the synthetic content prop (Primer BranchName takes content via React
 *   children, but A2UI children are component IDs, so content needs a value prop).
 * - `href` is the one carried slice of the anchor host-element spread — the designed
 *   navigation channel; clicking the label navigates there.
 * - `as` is Primer's polymorphic host element, narrowed to the two designed modes:
 *   an anchor (default) when the branch name navigates, a plain span when contextual.
 * - `.strict()` forbids any prop outside this surface.
 */
export const BranchNameApi = {
  name: 'BranchName',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      href: CommonSchemas.DynamicString.optional(),
      as: z.enum(['a', 'span']).optional(),
    })
    .strict(),
} as const;

export type BranchNameProps = z.infer<typeof BranchNameApi.schema>;
