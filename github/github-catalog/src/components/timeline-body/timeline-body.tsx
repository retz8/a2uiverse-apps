import type {ReactNode} from 'react';
import {Timeline as PrimerTimeline} from '@primer/react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {TimelineBodyApi} from './timeline-body.schema';
import {renderChildList} from '../../shared/child-list';

/** Resolved props: ChildList arrives as built `children`. */
type TimelineBodyViewProps = {
  children?: ReactNode;
};

export function TimelineBodyView({children}: TimelineBodyViewProps) {
  return <PrimerTimeline.Body>{children}</PrimerTimeline.Body>;
}

/**
 * Catalog entry: the generic binder resolves props, then renders TimelineBodyView.
 * - `props.children` is a resolved `ChildList`; `renderChildList` builds each content leaf via
 *   `buildChild`.
 * Props are passed explicitly (no spread): resolved props include extra binder setters.
 */
export const TimelineBodyComponent = createComponentImplementation(
  TimelineBodyApi,
  ({props, buildChild}) => (
    <TimelineBodyView>{renderChildList(props.children, buildChild)}</TimelineBodyView>
  ),
);
