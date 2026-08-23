import {z} from 'zod';
import {CommonSchemas} from '@a2ui/web_core/v0_9';

/**
 * Runtime (zod) representation of Primer ActionList.Heading, props-only (component name
 * `ActionList.Heading`). A heading labeling the entire action list. See
 * `_dev/docs/new-components/action-list-heading.md`.
 *
 * The list-level heading is a content leaf: its text -> synthetic `text` (the `Heading`
 * convention); unlike `GroupHeading`, it carries no trailing action.
 *
 * - `text` is the synthetic content channel -> `DynamicString`, required.
 * - `as` selects the semantic heading level; `size` is the visual size (present in the type,
 *   omitted from the doc's props table — carried faithfully, code is authority); `visuallyHidden`
 *   keeps the heading for assistive tech only. Defaults live in `catalog.json`.
 *
 * `.strict()` forbids any prop outside this surface.
 */
export const ActionListHeadingApi = {
  name: 'ActionList.Heading',
  schema: z
    .object({
      text: CommonSchemas.DynamicString,
      as: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']).optional(),
      size: z.enum(['small', 'medium', 'large']).optional(),
      visuallyHidden: z.boolean().optional(),
    })
    .strict(),
} as const;

export type ActionListHeadingProps = z.infer<typeof ActionListHeadingApi.schema>;
