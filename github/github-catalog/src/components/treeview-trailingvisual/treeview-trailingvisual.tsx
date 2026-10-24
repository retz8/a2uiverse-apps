import {useContext, type ReactNode} from 'react';
import {TreeView as PrimerTreeView} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TreeViewTrailingVisualApi} from './treeview-trailingvisual.schema.js';
import {SlotDrawnContext} from '../../shared/slot-drawn.js';

/** Resolved props: the `child` ComponentId arrives as a built node; `label` passes through. */
type TreeViewTrailingVisualViewProps = {
  label?: string;
  children?: ReactNode;
};

/** Inside a `TreeViewItem`, which draws the Primer visual around it, the icon alone. */
export function TreeViewTrailingVisualView({label, children}: TreeViewTrailingVisualViewProps) {
  if (useContext(SlotDrawnContext))
    return <SlotDrawnContext.Provider value={false}>{children}</SlotDrawnContext.Provider>;
  return <PrimerTreeView.TrailingVisual label={label}>{children}</PrimerTreeView.TrailingVisual>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders TreeViewTrailingVisualView.
 * - `props.child` (required ComponentId) is built via `buildChild` — the trailing icon.
 * - `props.label` passes through as the accessible label.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const TreeViewTrailingVisualComponent = createComponentImplementation(
  TreeViewTrailingVisualApi,
  ({props, buildChild}) => (
    <TreeViewTrailingVisualView label={props.label}>
      {buildChild(props.child)}
    </TreeViewTrailingVisualView>
  ),
);
