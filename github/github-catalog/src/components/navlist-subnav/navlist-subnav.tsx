import {useContext, type ReactNode} from 'react';
import {NavList as PrimerNavList} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {NavListSubNavApi} from './navlist-subnav.schema.js';
import {renderChildList} from '../../shared/child-list.js';
import {SlotDrawnContext} from '../../shared/slot-drawn.js';

/** Resolved props: `children` arrives as a built `ChildList`. */
type NavListSubNavViewProps = {
  children?: ReactNode;
};

/** Inside a `NavList.Item`, which draws the Primer sub-navigation around it, the children alone. */
export function NavListSubNavView({children}: NavListSubNavViewProps) {
  if (useContext(SlotDrawnContext))
    return <SlotDrawnContext.Provider value={false}>{children}</SlotDrawnContext.Provider>;
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
