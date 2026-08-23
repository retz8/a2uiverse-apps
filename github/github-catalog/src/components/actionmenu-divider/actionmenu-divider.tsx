import {ActionMenu as PrimerActionMenu} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ActionMenuDividerApi} from './actionmenu-divider.schema';

/** Resolved props: none — Divider is a self-contained separator. */
export function ActionMenuDividerView() {
  return <PrimerActionMenu.Divider />;
}

/**
 * Catalog entry: the generic binder resolves props (none), then renders ActionMenuDividerView.
 * A props-less separator; there is no content, buildChild, or onClick.
 */
export const ActionMenuDividerComponent = createComponentImplementation(
  ActionMenuDividerApi,
  () => <ActionMenuDividerView />,
);
