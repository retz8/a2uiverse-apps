import type {ReactNode} from 'react';
import {NavList as PrimerNavList} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {NavListLeadingVisualApi} from './navlist-leadingvisual.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved props: `children` arrives as a built `ChildList`. */
type NavListLeadingVisualViewProps = {
  children?: ReactNode;
};

export function NavListLeadingVisualView({children}: NavListLeadingVisualViewProps) {
  return <PrimerNavList.LeadingVisual>{children}</PrimerNavList.LeadingVisual>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders NavListLeadingVisualView.
 * `props.children` is a resolved `ChildList`; `renderChildList` builds each via `buildChild`.
 */
export const NavListLeadingVisualComponent = createComponentImplementation(
  NavListLeadingVisualApi,
  ({props, buildChild}) => (
    <NavListLeadingVisualView>
      {renderChildList(props.children, buildChild)}
    </NavListLeadingVisualView>
  ),
);
