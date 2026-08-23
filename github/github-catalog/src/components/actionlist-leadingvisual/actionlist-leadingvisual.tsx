import type {ReactNode} from 'react';
import {ActionList as PrimerActionList} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {ActionListLeadingVisualApi} from './actionlist-leadingvisual.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved props: the ChildList arrives as built `children`. */
type ActionListLeadingVisualViewProps = {
  children?: ReactNode;
};

export function ActionListLeadingVisualView({children}: ActionListLeadingVisualViewProps) {
  return <PrimerActionList.LeadingVisual>{children}</PrimerActionList.LeadingVisual>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders ActionListLeadingVisualView.
 * - `props.children` is a resolved `ChildList` (typically an `Icon`); `renderChildList` builds
 *   each via `buildChild`. Primer slots this before the item's label via its type-based slotting.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const ActionListLeadingVisualComponent = createComponentImplementation(
  ActionListLeadingVisualApi,
  ({props, buildChild}) => (
    <ActionListLeadingVisualView>
      {renderChildList(props.children, buildChild)}
    </ActionListLeadingVisualView>
  ),
);
