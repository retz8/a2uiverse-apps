import type {ReactNode} from 'react';
import {NavList as PrimerNavList} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {NavListTrailingVisualApi} from './navlist-trailingvisual.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved props: `children` arrives as a built `ChildList`. */
type NavListTrailingVisualViewProps = {
  children?: ReactNode;
};

export function NavListTrailingVisualView({children}: NavListTrailingVisualViewProps) {
  return <PrimerNavList.TrailingVisual>{children}</PrimerNavList.TrailingVisual>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders NavListTrailingVisualView.
 * `props.children` is a resolved `ChildList`; `renderChildList` builds each via `buildChild`.
 */
export const NavListTrailingVisualComponent = createComponentImplementation(
  NavListTrailingVisualApi,
  ({props, buildChild}) => (
    <NavListTrailingVisualView>
      {renderChildList(props.children, buildChild)}
    </NavListTrailingVisualView>
  ),
);
