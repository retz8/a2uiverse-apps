import {NavList as PrimerNavList} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {NavListDividerApi} from './navlist-divider.schema';

/** Propless: renders NavList.Divider with no forwarded props. */
export function NavListDividerView() {
  return <PrimerNavList.Divider />;
}

/** Catalog entry: a propless leaf — renders the separator directly. */
export const NavListDividerComponent = createComponentImplementation(NavListDividerApi, () => (
  <NavListDividerView />
));
