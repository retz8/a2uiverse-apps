import type {ReactNode} from 'react';
import {NavList as PrimerNavList} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {NavListApi} from './navlist.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved props: `children` arrives as a built `ChildList`; the aria strings resolve to plain strings. */
type NavListViewProps = {
  ariaLabel?: string;
  ariaLabelledby?: string;
  children?: ReactNode;
};

export function NavListView({ariaLabel, ariaLabelledby, children}: NavListViewProps) {
  return (
    <PrimerNavList aria-label={ariaLabel} aria-labelledby={ariaLabelledby}>
      {children}
    </PrimerNavList>
  );
}

/**
 * Catalog entry: the generic binder resolves props, then renders NavListView.
 * - `props.children` is a resolved `ChildList`; `renderChildList` builds each via `buildChild`.
 * - `props['aria-label']` / `props['aria-labelledby']` resolve to plain strings and map to the
 *   nav landmark's accessible name.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const NavListComponent = createComponentImplementation(NavListApi, ({props, buildChild}) => (
  <NavListView ariaLabel={props['aria-label']} ariaLabelledby={props['aria-labelledby']}>
    {renderChildList(props.children, buildChild)}
  </NavListView>
));
