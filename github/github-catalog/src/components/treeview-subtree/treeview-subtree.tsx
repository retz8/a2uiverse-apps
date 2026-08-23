import type {ReactNode} from 'react';
import {TreeView as PrimerTreeView} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TreeViewSubTreeApi} from './treeview-subtree.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved accessibility: the nested DynamicString is a plain string post-binder. */
type ResolvedAccessibility = {label?: string; description?: string};

/** Resolved props: ChildList arrives as built `children`; state/count pass through. */
type TreeViewSubTreeViewProps = {
  state?: 'initial' | 'loading' | 'done' | 'error';
  count?: number;
  accessibility?: ResolvedAccessibility;
  children?: ReactNode;
};

export function TreeViewSubTreeView({
  state,
  count,
  accessibility,
  children,
}: TreeViewSubTreeViewProps) {
  return (
    <PrimerTreeView.SubTree state={state} count={count} aria-label={accessibility?.label}>
      {children}
    </PrimerTreeView.SubTree>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders TreeViewSubTreeView.
 * - `props.children` (optional ChildList) is built via `renderChildList` — the nested items.
 * - `state`/`count` pass through as static config (they drive Primer's loading skeleton / error
 *   affordances).
 * - `props.accessibility` carries a resolved (plain-string) label; its inferred type still shows
 *   the nested DynamicString, so it is cast.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const TreeViewSubTreeComponent = createComponentImplementation(
  TreeViewSubTreeApi,
  ({props, buildChild}) => (
    <TreeViewSubTreeView
      state={props.state}
      count={props.count}
      accessibility={props.accessibility as ResolvedAccessibility | undefined}
    >
      {renderChildList(props.children, buildChild)}
    </TreeViewSubTreeView>
  ),
);
