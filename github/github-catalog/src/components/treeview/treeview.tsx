import type {ReactNode} from 'react';
import {TreeView as PrimerTreeView} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TreeViewApi} from './treeview.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved accessibility: the nested DynamicString is a plain string post-binder. */
type ResolvedAccessibility = {label?: string; description?: string};

/** Resolved props: ChildList arrives as built `children`; flat/truncate pass through. */
type TreeViewViewProps = {
  flat?: boolean;
  truncate?: boolean;
  accessibility?: ResolvedAccessibility;
  children?: ReactNode;
};

export function TreeViewView({flat, truncate, accessibility, children}: TreeViewViewProps) {
  return (
    <PrimerTreeView flat={flat} truncate={truncate} aria-label={accessibility?.label}>
      {children}
    </PrimerTreeView>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders TreeViewView.
 * - `props.children` is a resolved `ChildList` (static ids or a `{id, basePath}` template);
 *   `renderChildList` builds each `TreeViewItem` via `buildChild`.
 * - `props.accessibility` carries a resolved (plain-string) label at runtime; its inferred type
 *   still shows the nested DynamicString, so it is cast.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const TreeViewComponent = createComponentImplementation(
  TreeViewApi,
  ({props, buildChild}) => (
    <TreeViewView
      flat={props.flat}
      truncate={props.truncate}
      accessibility={props.accessibility as ResolvedAccessibility | undefined}
    >
      {renderChildList(props.children, buildChild)}
    </TreeViewView>
  ),
);
