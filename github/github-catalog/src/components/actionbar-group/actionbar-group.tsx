import type {ReactNode} from 'react';
import {ActionBar as PrimerActionBar} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ActionBarGroupApi} from './actionbar-group.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved props: the ChildList arrives as built `children`. */
type ActionBarGroupViewProps = {
  children?: ReactNode;
};

export function ActionBarGroupView({children}: ActionBarGroupViewProps) {
  return <PrimerActionBar.Group>{children}</PrimerActionBar.Group>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders ActionBarGroupView.
 * - `props.children` is a resolved `ChildList` (static `string[]` of ids or a `{id, basePath}[]`
 *   template expansion); `renderChildList` builds each via `buildChild` — the same container-slot
 *   convention as `ActionBar` / `ButtonGroup` / `Stack`.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const ActionBarGroupComponent = createComponentImplementation(
  ActionBarGroupApi,
  ({props, buildChild}) => (
    <ActionBarGroupView>{renderChildList(props.children, buildChild)}</ActionBarGroupView>
  ),
);
