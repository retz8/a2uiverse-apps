import {z} from 'zod';

/**
 * Runtime (zod) representation of Primer TreeView.DirectoryIcon, props-only. A preset folder icon
 * for a tree item that reflects the item's expanded state (open when expanded, closed when
 * collapsed).
 *
 * Zero-prop leaf: `DirectoryIcon` is a marker/preset icon placed inside a `LeadingVisual`; it
 * renders the folder icon and toggles open/closed with the parent item's expansion, carrying no
 * configurable props. `.strict()` forbids any prop.
 */
export const TreeViewDirectoryIconApi = {
  name: 'TreeViewDirectoryIcon',
  schema: z.object({}).strict(),
} as const;

export type TreeViewDirectoryIconProps = z.infer<typeof TreeViewDirectoryIconApi.schema>;
