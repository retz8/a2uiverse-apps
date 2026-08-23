import {z} from 'zod';

/**
 * Runtime (zod) representation of Primer NavList.Divider, props-only. A visual separator between
 * groups of navigation items.
 *
 * A propless leaf — its only Primer props are styling passthroughs (`className` / `style`, dropped)
 * and its `children` are ignored (it renders a rule). The schema is the empty object; `.strict()`
 * forbids any prop.
 */
export const NavListDividerApi = {
  name: 'NavList.Divider',
  schema: z.object({}).strict(),
} as const;

export type NavListDividerProps = z.infer<typeof NavListDividerApi.schema>;
