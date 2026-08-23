import {z} from 'zod';

/**
 * Runtime (zod) representation of Primer `ActionBar.Divider` (exported as `VerticalDivider`),
 * props-only (component name `ActionBar.Divider`). A vertical separator inside an `ActionBar`
 * toolbar.
 *
 * The Primer component takes no props — it renders a single `aria-hidden` separator and registers
 * itself as a `divider` item so it is preserved when buttons collapse into the overflow menu.
 * The schema is therefore an empty object; `.strict()` forbids any prop.
 */
export const ActionBarDividerApi = {
  name: 'ActionBar.Divider',
  schema: z.object({}).strict(),
} as const;

export type ActionBarDividerProps = z.infer<typeof ActionBarDividerApi.schema>;
