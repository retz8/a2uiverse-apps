import type {ReactNode} from 'react';
import {NavList as PrimerNavList} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {NavListGroupApi} from './navlist-group.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved props: `children` arrives as a built `ChildList`; `title` resolves to a plain string. */
type NavListGroupViewProps = {
  title?: string;
  children?: ReactNode;
};

export function NavListGroupView({title, children}: NavListGroupViewProps) {
  return <PrimerNavList.Group title={title}>{children}</PrimerNavList.Group>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders NavListGroupView.
 * `props.children` is a resolved `ChildList`; `renderChildList` builds each via `buildChild`.
 */
export const NavListGroupComponent = createComponentImplementation(
  NavListGroupApi,
  ({props, buildChild}) => (
    <NavListGroupView title={props.title}>
      {renderChildList(props.children, buildChild)}
    </NavListGroupView>
  ),
);
