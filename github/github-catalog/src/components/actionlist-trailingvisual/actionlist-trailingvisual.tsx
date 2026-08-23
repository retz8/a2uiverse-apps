import type {ReactNode} from 'react';
import {ActionList as PrimerActionList} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ActionListTrailingVisualApi} from './actionlist-trailingvisual.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved props: the ChildList arrives as built `children`. */
type ActionListTrailingVisualViewProps = {
  children?: ReactNode;
};

export function ActionListTrailingVisualView({children}: ActionListTrailingVisualViewProps) {
  return <PrimerActionList.TrailingVisual>{children}</PrimerActionList.TrailingVisual>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders ActionListTrailingVisualView.
 * - `props.children` is a resolved `ChildList` (icon/counter/keyboard hint); `renderChildList`
 *   builds each via `buildChild`. Primer slots this after the item's label.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const ActionListTrailingVisualComponent = createComponentImplementation(
  ActionListTrailingVisualApi,
  ({props, buildChild}) => (
    <ActionListTrailingVisualView>
      {renderChildList(props.children, buildChild)}
    </ActionListTrailingVisualView>
  ),
);
