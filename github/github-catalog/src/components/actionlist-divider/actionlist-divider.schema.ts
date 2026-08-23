import {z} from 'zod';

/**
 * Runtime (zod) representation of Primer ActionList.Divider, props-only (component name
 * `ActionList.Divider`). A visual separator between items or groups in an action list. See
 * `_dev/docs/new-components/action-list-divider.md`.
 *
 * A props-less leaf: every real prop is a styling passthrough with no A2UI representation, so the
 * schema is an empty object. `.strict()` forbids any prop (there are none to carry).
 */
export const ActionListDividerApi = {
  name: 'ActionList.Divider',
  schema: z.object({}).strict(),
} as const;

export type ActionListDividerProps = z.infer<typeof ActionListDividerApi.schema>;
