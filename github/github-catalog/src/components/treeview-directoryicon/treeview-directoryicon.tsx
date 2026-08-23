import {TreeView as PrimerTreeView} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TreeViewDirectoryIconApi} from './treeview-directoryicon.schema';

/** Zero-prop preset icon: renders Primer's folder glyph, which toggles open/closed with the
 * parent item's expansion (it reads Primer's item context). */
export function TreeViewDirectoryIconView() {
  return <PrimerTreeView.DirectoryIcon />;
}

/**
 * Catalog entry: a zero-prop leaf. No props to resolve, no buildChild — placed inside a
 * `LeadingVisual`, it renders the expand-reflecting folder icon.
 */
export const TreeViewDirectoryIconComponent = createComponentImplementation(
  TreeViewDirectoryIconApi,
  () => <TreeViewDirectoryIconView />,
);
