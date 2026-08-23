import type {ReactNode} from 'react';
import {NavList as PrimerNavList} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {NavListSubNavApi} from './navlist-subnav.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved props: `children` arrives as a built `ChildList`. */
type NavListSubNavViewProps = {
  children?: ReactNode;
};

export function NavListSubNavView({children}: NavListSubNavViewProps) {
  return <PrimerNavList.SubNav>{children}</PrimerNavList.SubNav>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders NavListSubNavView.
 * `props.children` is a resolved `ChildList`; `renderChildList` builds each via `buildChild`.
 */
export const NavListSubNavComponent = createComponentImplementation(
  NavListSubNavApi,
  ({props, buildChild}) => (
    <NavListSubNavView>{renderChildList(props.children, buildChild)}</NavListSubNavView>
  ),
);
