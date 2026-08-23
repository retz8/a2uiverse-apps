import type {ReactNode} from 'react';
import {TreeView as PrimerTreeView} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TreeViewLeadingVisualApi} from './treeview-leadingvisual.schema';

/** Resolved props: the `child` ComponentId arrives as a built node; `label` passes through. */
type TreeViewLeadingVisualViewProps = {
  label?: string;
  children?: ReactNode;
};

export function TreeViewLeadingVisualView({label, children}: TreeViewLeadingVisualViewProps) {
  return <PrimerTreeView.LeadingVisual label={label}>{children}</PrimerTreeView.LeadingVisual>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders TreeViewLeadingVisualView.
 * - `props.child` (required ComponentId) is built via `buildChild` — the leading icon.
 * - `props.label` passes through as the accessible label.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const TreeViewLeadingVisualComponent = createComponentImplementation(
  TreeViewLeadingVisualApi,
  ({props, buildChild}) => (
    <TreeViewLeadingVisualView label={props.label}>
      {buildChild(props.child)}
    </TreeViewLeadingVisualView>
  ),
);
