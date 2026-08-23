import type {ReactNode} from 'react';
import {Timeline as PrimerTimeline} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TimelineActionsApi} from './timeline-actions.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved props: ChildList arrives as built `children`. */
type TimelineActionsViewProps = {
  children?: ReactNode;
};

export function TimelineActionsView({children}: TimelineActionsViewProps) {
  return <PrimerTimeline.Actions>{children}</PrimerTimeline.Actions>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders TimelineActionsView.
 * - `props.children` is a resolved `ChildList`; `renderChildList` builds each action control via
 *   `buildChild`. Any interactive child (e.g. a `Button`) carries its own action surface.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const TimelineActionsComponent = createComponentImplementation(
  TimelineActionsApi,
  ({props, buildChild}) => (
    <TimelineActionsView>{renderChildList(props.children, buildChild)}</TimelineActionsView>
  ),
);
