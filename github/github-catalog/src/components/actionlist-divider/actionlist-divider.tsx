import {ActionList as PrimerActionList} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ActionListDividerApi} from './actionlist-divider.schema';

/** Resolved props: none — Divider is a self-contained separator. */
export function ActionListDividerView() {
  return <PrimerActionList.Divider />;
}

/**
 * Catalog entry: the generic binder resolves props (none), then renders ActionListDividerView.
 * A props-less separator; there is no content, buildChild, or onClick.
 */
export const ActionListDividerComponent = createComponentImplementation(
  ActionListDividerApi,
  () => <ActionListDividerView />,
);
