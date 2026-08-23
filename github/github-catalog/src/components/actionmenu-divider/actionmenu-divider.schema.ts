import {z} from 'zod';

/**
 * Runtime (zod) representation of Primer `ActionMenu.Divider` (component name `ActionMenu.Divider`),
 * props-only. A visual separator between items or groups in a menu — the sibling twin of
 * `ActionList.Divider`. Part of the `ActionMenu` compound family (6.39); see
 * `_dev/docs/new-components/actionmenu-divider.md`.
 *
 * `ActionMenu.Divider = ActionListDividerProps` (`{className?, style?}`): a props-less leaf — every
 * real prop is a styling passthrough with no A2UI representation, so the schema is an empty object
 * (the `actionlist-divider.md` precedent). `.strict()` forbids any prop (there are none to carry).
 */
export const ActionMenuDividerApi = {
  name: 'ActionMenu.Divider',
  schema: z.object({}).strict(),
} as const;

export type ActionMenuDividerProps = z.infer<typeof ActionMenuDividerApi.schema>;
